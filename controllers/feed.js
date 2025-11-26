const Post = require("../Model/post");
const fs = require("fs");
const path = require("path");
const User = require("../Model/user");
const { validationResult } = require("express-validator");
const io = require("../socket-io");

// Helper → Converts "images/file.jpg" → "http://localhost:8080/images/file.jpg"
const buildImageUrl = (req, filePath) => {
  return (
    req.protocol + "://" + req.get("host") + "/" + filePath.replace(/\\/g, "/")
  );
};

exports.getPosts = async (req, res, next) => {
  const currentPage = req.query.page || 1;
  const perPage = 2;

  try {
    const totalItems = await Post.find().countDocuments();
    const posts = await Post.find()
      .populate("creator")
      .sort({ createdAt: -1 })
      .skip((currentPage - 1) * perPage)
      .limit(perPage);

    res.status(200).json({
      message: "post successfully fetched",
      posts: posts.map((post) => {
        return {
          ...post._doc,
          imageUrl: buildImageUrl(req, post.imageUrl),
        };
      }),
      totalItems: totalItems,
    });
  } catch (errors) {
    if (!errors.statusCode) {
      errors.statusCode = 500;
    }
    next(errors);
  }
};

exports.getPost = async (req, res, next) => {
  const postId = req.params.postId;

  try {
    const post = await Post.findById(postId);
    if (!post) {
      const error = new Error("could not find post");
      error.statusCode = 404;
      throw error;
    }

    res.status(200).json({
      message: "Single Post fetched successfully",
      post: {
        ...post._doc,
        imageUrl: buildImageUrl(req, post.imageUrl),
      },
    });
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }
    next(error);
  }
};

exports.createPost = async (req, res, next) => {
  const errors = validationResult(req);
  const title = req.body.title;
  const content = req.body.content;

  if (!errors.isEmpty()) {
    const errors = new Error("validation failed");
    errors.statusCode = 422;
    throw errors;
  }

  if (!req.file) {
    const errors = new Error("did not receive any file!");
    errors.statusCode = 422;
    throw errors;
  }

  const imageUrl = req.file.path;

  const post = new Post({
    title: title,
    content: content,
    creator: req.userId,
    imageUrl: imageUrl,
  });

  try {
    await post.save();
    const user = await User.findById(req.userId);
    user.posts.push(post);
    await user.save();

    io.getIo().emit("posts", {
      action: "create",
      post: { ...post._doc, creator: { _id: req.userId, name: user.name } },
    });

    res.status(201).json({
      message: "saved in database successfully",
      post: {
        ...post._doc,
        imageUrl: buildImageUrl(req, post.imageUrl),
      },
      creator: { _id: user._id, name: user.name },
    });
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }
    next(error);
  }
};

exports.updatePost = async (req, res, next) => {
  const postId = req.params.postId;
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const error = new Error("No Valid Input!");
    error.statusCode = 422;
    throw error;
  }

  const content = req.body.content;
  const title = req.body.title;
  let imageUrl = req.body.image;

  if (req.file) {
    imageUrl = req.file.path;
  }

  if (!imageUrl) {
    const error = new Error("No Image Found!");
    error.statusCode = 422;
    throw error;
  }

  try {
    const post = await Post.findById(postId).populate("creator");

    if (!post) {
      const error = new Error("Could Not Find Any Post!");
      error.statusCode = 404;
      throw error;
    }

    if (post.creator._id.toString() !== req.userId) {
      const error = new Error("User Not Allowed!");
      error.statusCode = 403;
      throw error;
    }

    if (imageUrl !== post.imageUrl) {
      clearImage(post.imageUrl);
    }

    post.title = title;
    post.content = content;
    post.imageUrl = imageUrl;

    const result = await post.save();

    io.getIo().emit("posts", {
      action: "update",
      post: {
        ...result._doc,
        imageUrl: buildImageUrl(req, result.imageUrl),
      },
    });

    res.status(200).json({
      message: "successfully Updated!",
      post: {
        ...result._doc,
        imageUrl: buildImageUrl(req, result.imageUrl),
      },
    });
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }
    next(error);
  }
};

exports.deletePost = async (req, res, next) => {
  const postId = req.params.postId;

  try {
    const post = await Post.findById(postId).populate("creator");

    if (!post) {
      const error = new Error("Post Does Not Exist!");
      error.statusCode = 404;
      throw error;
    }

    if (post.creator.toString() !== req.userId) {
      const error = new Error("User Not Allowed!");
      error.statusCode = 403;
      throw error;
    }

    clearImage(post.imageUrl);
    await Post.findByIdAndDelete(postId);

    const user = await User.findById(req.userId);
    user.posts.pull(postId);
    await user.save();

    io.getIo().emit("posts", { action: "delete", post: postId });

    res.status(200).json({ message: "deleted successfully!" });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

const clearImage = (filePath) => {
  filePath = path.join(__dirname, "..", filePath);
  fs.unlink(filePath, (err) => console.log(err));
};
