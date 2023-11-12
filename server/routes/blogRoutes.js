const express = require('express');
const router = express.Router();
const blogController = require('../controllers/blogController'); 


// get homepage
router.get('/', blogController.homepage);

// get about page
router.get('/about', blogController.aboutPage);

// get blog page
router.get('/blog', blogController.blogPage);

// get submit-post form
router.get('/submit-post', blogController.postForm);

// post submit-post
router.post('/submit-post', blogController.submitPost);

// GET update post form
router.get('/update-post/:id', blogController.updatePostForm);

// POST update post
router.post('/update-post/:id', blogController.updatePost);

// get single post page
router.get('/post/:id', blogController.singlePost);

// DELETE post 
router.delete('/post/:id', blogController.deletePost);

//get all categories
router.get('/categories', blogController.allCategories);

// get single category page
router.get('/category/:id', blogController.singleCat);

// post add new category
router.post('/submit-category', blogController.addCategory);

// post add new category
router.get('/submit-category', blogController.addCatForm);

// GET update category form
router.get('/update-category/:id', blogController.updateCategoryForm);

// POST update category
router.post('/update-category/:id', blogController.updateCategory);

//DELETE category
router.delete('/category/:id', blogController.deleteCategory);


module.exports = router;