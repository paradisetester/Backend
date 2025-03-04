const express = require('express');
const Comment = require('../models/Comment');
const authenticate = require('../middleware/authenticate');
const mongoose = require('mongoose');

const router = express.Router();


/* ------------------------------------------
 ✅ Route: Add a Comment
------------------------------------------ */
router.post('/add-comment/:blogId', authenticate, async (req, res) => {
    try {
        const { blogId } = req.params;
        const { content } = req.body;

        if (!content || typeof content !== 'string') {
            return res.status(400).json({ message: 'Content must be a valid string.' });
        }

        const userId = req.employeeId; // Ensure from middleware

        if (!userId) {
            return res.status(401).json({ message: 'User is not authenticated.' });
        }

        const newComment = new Comment({
            content,
            blog: blogId,
            user: userId,
        });

        await newComment.save();

        const populatedComment = await Comment.findById(newComment._id).populate('user', 'name email');

        res.status(201).json({ comment: populatedComment });
    } catch (err) {
        console.error('Error adding comment:', err);
        res.status(500).json({ message: 'Failed to add comment.', error: err.message });
    }
});

/* ------------------------------------------
 ✅ Route: Add a Reply to a Comment or Reply
------------------------------------------ */
router.post('/add-reply/:commentId', authenticate, async (req, res) => {
    try {
        const { content, parentReplyId } = req.body;
        const { commentId } = req.params;

        if (!content || typeof content !== 'string') {
            return res.status(400).json({ error: 'Content is required and must be a string.' });
        }

        const userId = req.employeeId;
        if (!userId) {
            return res.status(401).json({ error: 'User is not authenticated.' });
        }

        const comment = await Comment.findById(commentId);
        if (!comment) {
            return res.status(404).json({ error: 'Comment not found.' });
        }

        // Add reply with parentId
        const newReply = {
            _id: new mongoose.Types.ObjectId(),
            user: userId,
            content,
            parentId: parentReplyId || null,
            createdAt: new Date(),
        };

        comment.replies.push(newReply);
        await comment.save();

        res.status(201).json({ message: 'Reply added successfully!', reply: newReply });
    } catch (err) {
        console.error('Error adding reply:', err);
        res.status(500).json({ error: 'Failed to add reply.', details: err.message });
    }
});

/* ------------------------------------------
 ✅ Route: Fetch Comments for a Blog
------------------------------------------ */
router.get('/get-comments/:blogId', async (req, res) => {
    try {
        const { blogId } = req.params;
        console.log(blogId, 'BlogID')
        const comments = await Comment.find({ blog: blogId })
        .populate('user', 'name email')
        .populate('replies.user', 'name email')
        .sort({ createdAt: -1 });
        
        console.log(comments, 'Comments')
        // Build a reply tree on the backend (optional, can also do on frontend)
        const buildReplyTree = (replies) => {
            const replyMap = {};
            const rootReplies = [];

            replies.forEach(reply => {
                replyMap[reply._id] = { ...reply.toObject(), children: [] };
            });

            replies.forEach(reply => {
                if (reply.parentId) {
                    replyMap[reply.parentId]?.children.push(replyMap[reply._id]);
                } else {
                    rootReplies.push(replyMap[reply._id]);
                }
            });
            return rootReplies;
        };

        const structuredComments = comments.map(comment => ({
            ...comment.toObject(),
            replies: buildReplyTree(comment.replies),
        }));

        res.status(200).json(structuredComments);
    } catch (err) {
        console.error('Error fetching comments:', err);
        res.status(500).json({ error: 'Failed to fetch comments.' });
    }
});


/* ------------------------------------------
 ✅ Route: Delete a Comment (and its replies)
------------------------------------------ */
router.delete('/delete-comment/:commentId', authenticate, async (req, res) => {
    try {
        const { commentId } = req.params;
        const userId = req.employeeId;

        const comment = await Comment.findById(commentId);

        if (!comment) {
            return res.status(404).json({ error: 'Comment not found.' });
        }

        if (comment.user.toString() !== userId && req.role !== 'admin') {
            return res.status(403).json({ error: 'Not authorized to delete this comment.' });
        }

        await Comment.deleteOne({ _id: commentId });
        res.status(200).json({ message: 'Comment deleted successfully!' });
    } catch (err) {
        console.error('Error deleting comment:', err);
        res.status(500).json({ error: 'Failed to delete comment.' });
    }
});


/* ------------------------------------------
 ✅ Route: Update a Comment
------------------------------------------ */
router.put('/update-comment/:commentId', authenticate, async (req, res) => {
    try {
        const { commentId } = req.params;
        const { content } = req.body;
        const userId = req.employeeId;

        const comment = await Comment.findById(commentId);

        if (!comment) {
            return res.status(404).json({ error: 'Comment not found.' });
        }

        if (comment.user.toString() !== userId && req.role !== 'admin') {
            return res.status(403).json({ error: 'Not authorized to update this comment.' });
        }

        comment.content = content;
        await comment.save();

        res.status(200).json({ message: 'Comment updated successfully!' });
    } catch (err) {
        console.error('Error updating comment:', err);
        res.status(500).json({ error: 'Failed to update comment.' });
    }
});

/* ------------------------------------------
 ✅ Route: Delete a Reply from a Comment
------------------------------------------ */
router.delete('/delete-reply/:commentId/:replyId', authenticate, async (req, res) => {
    try {
        const { commentId, replyId } = req.params;
        const userId = req.employeeId;

        const comment = await Comment.findById(commentId);

        if (!comment) {
            return res.status(404).json({ error: 'Comment not found.' });
        }

        const reply = comment.replies.id(replyId);

        if (!reply) {
            return res.status(404).json({ error: 'Reply not found.' });
        }

        if (reply.user.toString() !== userId && req.role !== 'admin') {
            return res.status(403).json({ error: 'Not authorized to delete this reply.' });
        }

        reply.deleteOne();
        await comment.save();

        res.status(200).json({ message: 'Reply deleted successfully!' });
    } catch (err) {
        console.error('Error deleting reply:', err);
        res.status(500).json({ error: 'Failed to delete reply.' });
    }
});


module.exports = router;
