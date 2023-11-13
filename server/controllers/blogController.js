require('../models/database');
const Category = require('../models/Category');
const Post = require('../models/Post');

//display columns according to the number of posts
function calculateColumnClass(postCount) {
  switch (postCount) {
    case 1:
      return "row-cols-1";
    case 2:
      return "row-cols-2";
    case 3:
      return "row-cols-3";
    case 4:
      return "row-cols-4";  
    default:
      return "row-cols-lg-5"; //default layout
  }
}


// GET'/' - homepage 

exports.homepage = async(req, res) => {
  try {
    const limitNumberCat = 4;
    const limitNumberBlog = 10;
    const categories = await Category.find({}).sort({_id: -1}).limit(limitNumberCat);
    const latestPosts = await Post.find({}).sort({_id: -1}).limit(limitNumberBlog);

    // Calculate the column class based on the number of latest posts
    const columnClass = calculateColumnClass(latestPosts.length);
  
    res.render('index', { 
      title: 'SmartEco4Future - Home', 
      categories, 
      latestPosts,
      columnClass
     } );

  } catch (error) {
    res.status(500).send({message: error.message || "An error occured" });
  }
}
 
// GET /submit-post - post form

exports.postForm = async (req, res) => {
  const infoErrorsObj = req.flash('infoErrors');
  const infoSubmitObj = req.flash('infoSubmit');
  const validationErrors = req.flash('validationErrors');
  const defaultImagePath = '/uploads/post-generic.jpg';
  const errorMessages = req.flash('error');
  let isSubmitted = false; 

  try {
    // Fetch existing categories
    const categories = await Category.find();

    res.render('submit-post', {
      title: 'Submit Post',
      excludeHeader: true,
      infoErrorsObj,
      infoSubmitObj,
      validationErrors,
      errorMessages,
      defaultImagePath,
      isSubmitted,
      categories
    });

  } catch (error) {
    console.error('Error fetching categories:', error);

    res.status(500).send('Internal Server Error');
  }
};


 //submit-post
exports.submitPost = async (req, res) => {
  let isSubmitted = false;

  // Fetch existing categories
  const categories = await Category.find();

 try {
 
   let imageUploadFile;
   let uploadPath;
   let newImageName;
   let validationErrors = [];


   if (!req.files || Object.keys(req.files).length === 0) {
     validationErrors.push('No image file uploaded.');

   } else {
     imageUploadFile = req.files.image;
     newImageName = Date.now() + imageUploadFile.name;
     uploadPath = require('path').resolve('./') + '/public/uploads/' + newImageName;

     imageUploadFile.mv(uploadPath, function (err) {
       if (err) {
         validationErrors.push('Error while uploading image file.');
       }
     });
   }

   if (!req.body.title) {
     validationErrors.push('Title is required.');
     
   }

   if (!req.body.content) {
     validationErrors.push('Content is required.');    
   }

   if (req.body.category === 'Select Category') {
     validationErrors.push('Category is required.');
       }

   if (req.body.title) {
     // Check if a post with the same title already exists
     const existingPost = await Post.findOne({ title: req.body.title });  

     if (existingPost) { 
       validationErrors.push('A post with this title already exists.');
     }
   }


   if (validationErrors.length > 0) {
    req.flash('validationErrors', validationErrors);
    return res.redirect('/submit-post');
  }
  

   const newPost = new Post({
     title: req.body.title,
     content: req.body.content,
     category: req.body.category,
     image: newImageName,
   }); 

   const savedPost = await newPost.save();
   const postURL = `/post/${savedPost._id}`; 
   console.log(postURL);

   if (savedPost) {
     isSubmitted = true;
   }

   req.flash('success', 'Post submitted successfully!');
   

   res.render('submit-post', {
     title: 'Submit Post',
     excludeHeader: true,
     validationErrors,
     infoSubmitObj: req.flash('infoSubmit'), 
     isSubmitted,
     categories,
     postURL,    
   });


 } catch (error) {
   console.error(error);
   req.flash('error', 'An error occurred while submitting the post.');
   res.redirect('/submit-post');
 }
};

// GET /update-post/:id
exports.updatePostForm = async (req, res) => {

  try {
    const postId = req.params.id;
    const existingPost = await Post.findById(postId);

    if (!existingPost) {
      req.flash('error', 'Post not found');
      return res.redirect('/'); 
    }

     // Fetch existing categories
     const categories = await Category.find();

    res.render('update-post', { 
      title: 'Update Post',
      excludeHeader: true, 
      existingPost,
      categories,
      messages: {
        error: req.flash('error'),
        success: req.flash('success'),
      },
      excludeHeader: true
    });

  } catch (error) {
    console.error(error);
    req.flash('error', 'An error occurred while rendering the update post form.');
    res.redirect('/');
  }
};


// POST /update-post/:id
exports.updatePost = async (req, res) => {
  try {
    const postId = req.params.id;
    const { title, content, category } = req.body;
    let updatedImage;

    // Check if a new image is being uploaded
    if (req.files && req.files.image) {
      const imageFile = req.files.image;
      updatedImage = Date.now() + imageFile.name;

      // Save the file using express-fileupload
      const uploadPath = require('path').resolve('./') + '/public/uploads/' + updatedImage;
      imageFile.mv(uploadPath, (err) => {

        if (err) {
          console.error(err);
          return res.status(500).send(err);
        }
      });

    } else {
      // No new image uploaded, keep the existing image
      const existingPost = await Post.findById(postId);
      updatedImage = existingPost.image;
    }
    
    const validationErrors = [];

    if (!title) {
      validationErrors.push('Title is required.');
    }

    if (!content) {
      validationErrors.push('Content is required.');
    }

    if (category === 'Select Category') {
      validationErrors.push('Category is required.');
    }


    if (validationErrors.length > 0) {
      const existingPost = await Post.findById(postId);

      return res.render('update-post', {
        title: 'Update Post',
        excludeHeader: true,
        existingPost,
        validationErrors,
        messages: {
          error: ['Validation errors occurred.'],
          success: ['']
        },
      });
    }

    // Update the post with the new information
    const updatedPost = await Post.findByIdAndUpdate(
      postId,
      { title, content, category, image: updatedImage },
      { new: true }
    );
    console.log(postId);

    if (!updatedPost) {
      req.flash('error', 'Post not found');
      return res.redirect('/blog');
    }

     // Fetch existing categories
     const categories = await Category.find();

    req.flash('success', 'Post updated!');

    console.log(`updatedPost: ${updatedPost}`);

    const updatedPostURL = `/post/${updatedPost._id}`;  
    console.log(updatedPostURL);

     // Check if a category ID is provided in the query parameters
     const defaultCategory = req.query.category || null;
     console.log(defaultCategory);
    
    
    res.render('update-post', {
      title: 'Update Successful',
      excludeHeader: true,
      existingPost: updatedPost,
      categories,
      validationErrors: [], 
      defaultCategory,
      messages: {
        error: req.flash('error'),
        success: req.flash('success'),
      },
    });

  } catch (error) {
    console.error(error);
    req.flash('error', 'An error occurred while updating the post.');
    res.redirect('/');
  }
};


// GET /about page
exports.aboutPage = async (req, res) => {
  res.render('about', { title: 'About Us', excludeHeader: true});
};


// GET /blog page - all posts
exports.blogPage = async (req, res) => {
  try {
    
  const blogPosts = await Post.find({}).sort({_id: -1});

    res.render('blog', { 
      title: 'SmartEco4Future - Blog',
      excludeHeader: true, 
      blogPosts,
     });

  } catch (error) {
    res.status(500).send({message: error.message || "An error occured" });
  }

  res.render('blog', { title: 'Blog Posts', excludeHeader: true});
};


/*
GET /post/:id
Render single post
*/ 
exports.singlePost = async(req, res) => {
  try {

    let postId = req.params.id;
    const post = await Post.findById(postId).populate('category'); 
    
    //handle category associated with the post
    const categoryName = post.category; 
    const category = await Category.findOne({ name: categoryName });

  if (!category) {  
    return res.status(404).send('Category not found');
  }

  const postCatId = category._id;
  console.log('postCat id: ' + postCatId);

  const updateLink = `/post/${postId}`;

    res.render('post', { 
      title: 'SmartEco4Future',
      excludeHeader: true, 
      post,
      updateLink, 
      postCatId,
     });

  } catch (error) {
    res.status(500).send({message: error.message || "An error Occured" });
  }
} 


// DELETE /post/:id
// Delete a single post

exports.deletePost = async (req, res) => {
  try {
    const postId = req.params.id;
    const result = await Post.deleteOne({ _id: postId });
    console.log(`postId: ${postId}`);
    console.log(`result: ${result}`);

    if (result.deletedCount === 0) {
      const notFoundMessage = 'Post not found';
      return res.status(404).json({ message: notFoundMessage });
    }

    const successMessage = 'Post deleted successfully';
    return res.status(200).json({ message: successMessage });

  } catch (error) {
    const errorMessage = error.message || 'An error occurred';
    return res.status(500).json({ message: errorMessage });
    
  }
};


 //GET all categories

exports.allCategories = async(req, res) => {
  try {
    const categories = await Category.find({});
    res.render('categories', { 
      title: 'SmartEco4Future - Categories', 
      categories,
      excludeHeader: true
    });
  } catch (error) {
    res.status(500).send({message: error.message || "Error Occured" });
  }
} 

/*
GET /category/:id
Render single category page   
*/ 

exports.singleCat = async (req, res) => {
  try {
    let catId = req.params.id;
    const category = await Category.findById(catId);

    if (!category) {
      return res.status(404).send({ message: 'Category not found' });
    }

    const categoryPosts = await Post.find({ category: { $regex: new RegExp(category.name, 'i') } });
   

    console.log('Category ID:', catId, 'Category', category);
    console.log('Category Posts:', categoryPosts);

    res.render('category', {
      title: category.name,
      category,
      categoryId: catId,
      categoryPosts,
      excludeHeader: true
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send({ message: error.message || "An error Occurred" });
  }
}


// GET /submit-category - form

exports.addCatForm = async (req, res) => {
  const infoErrorsObj = req.flash('infoErrors');
  const infoSubmitObj = req.flash('infoSubmit');
  const validationErrors = req.flash('validationErrors');
  const errorMessages = req.flash('error');


  res.render('submit-category', {
    title: 'Submit Category',
    excludeHeader: true,
    infoErrorsObj,
    infoSubmitObj,
    validationErrors,
    errorMessages,
  });
};


//POST - Add New Category

exports.addCategory = async (req, res) => {

 try {

  console.log('Request Files:', req.files);
 
  let imageUploadFile;
  let uploadPath;
  let newImageName;
  let validationErrors = [];


  if (!req.files || !req.files.imageCat || Object.keys(req.files).length === 0) {
    validationErrors.push('No image file uploaded.');

  } else {
    imageUploadFile = req.files.imageCat;
    newImageName = Date.now() + imageUploadFile.name;
    uploadPath = require('path').resolve('./') + '/public/uploads/' + newImageName;
  
    imageUploadFile.mv(uploadPath, function (err) {
      if (err) {
        validationErrors.push('Error while uploading image file.');
      }
    });
  }
  
   if (!req.body.name) {
     validationErrors.push('Category name is required.');     
   }

   if (req.body.name) {
     // Check if a category with the same name already exists
     const existingCat = await Category.findOne({ name: req.body.name });  

     if (existingCat) { 
       validationErrors.push('A category with this name already exists.');
     }
   }

   if (validationErrors.length > 0) {
    req.flash('validationErrors', validationErrors);
    res.redirect('/submit-category');
    return; 
  }
  
   const newCategory = new Category({
     name: req.body.name,
     image: newImageName,
   }); 

   const savedCat= await newCategory.save();
   const catURL = `/category/${savedCat._id}`; 
   console.log('Request Body:', req.body);

   req.flash('infoSubmit', 'Category submitted successfully.');

   res.render('submit-category', {
     title: 'Submit Category',
     excludeHeader: true,
     validationErrors,
     catURL,
     infoSubmitObj: req.flash('infoSubmit'),       
   });


 } catch (error) {
   console.error(error);
   req.flash('error', 'An error occurred while submitting the category.');
   res.redirect('/submit-category');
 }
};


// GET /update-category/:id
//Update Category Form

exports.updateCategoryForm = async (req, res) => {

  try {
    const catId = req.params.id;
    const existingCat = await Category.findById(catId);

    if (!existingCat) {
      req.flash('error', 'Category not found');
      return res.redirect('/categories'); 
    }

    res.render('update-category', { 
      title: 'Update Category',
      excludeHeader: true, 
      existingCat,
      messages: {
        error: req.flash('error'),
        success: req.flash('success'),
      }     
    });

  } catch (error) {
    console.error(error);
    req.flash('error', 'An error occurred while rendering the update category form.');
    res.redirect('/');
  }
};


// POST /update-category/:id

exports.updateCategory= async (req, res) => {
  try {
    const catId = req.params.id;
    const { name } = req.body;
    let updatedImage;
    const existingCat = await Category.findById(catId);
   
    // Check if a new image is being uploaded
    if (req.files && req.files.image) {
      const imageFile = req.files.image;
      updatedImage = Date.now() + imageFile.name;
      
      const uploadPath = require('path').resolve('./') + '/public/uploads/' + updatedImage;
      imageFile.mv(uploadPath, (err) => {
        if (err) {
          console.error(err);
          return res.status(500).send(err);
        }
      });

    } else {
      // No new image uploaded, keep the existing image
      const existingCat = await Category.findById(catId);
      updatedImage = existingCat.image;
    }
    
    const validationErrors = [];

    if (!name) {
      validationErrors.push('Name is required.');
    }


    if (validationErrors.length > 0) {
      console.log(`existingCat: ${existingCat}`);

      return res.render('update-category', {
        title: 'Update Category',
        excludeHeader: true,
        existingCat,
        validationErrors,
        messages: {
          error: ['Validation errors occurred.'],
          success: ['']
        },
      });
    }

    // Update the category with the new information
    const updatedCat= await Category.findByIdAndUpdate(
      catId,
      { name, image: updatedImage },
      { new: true }
    );
    console.log(catId);

    if (!updatedCat) {
      req.flash('error', 'category not found');
      return res.redirect('/categories');
    }

    // Update posts associated with the category
    await Post.updateMany(
      { category: existingCat.name },
      { $set: { category: name }} 
    );

    console.log('Existing Category Name:', existingCat.name);
    console.log('New Category Name:', name);

  
    req.flash('success', 'Category updated successfully!');

    console.log(updatedCat);
    const updatedCatURL = `/category/${updatedCat._id}`;  
    console.log(updatedCatURL);
    
    // Render the update-category view with success message
    res.render('update-category', {
      title: 'Update Successful',
      excludeHeader: true,
      updatedCat,
      existingCat: updatedCat,
      updatedCatURL,
      validationErrors: [], 
      messages: {
        error: req.flash('error'),
        success: req.flash('success'),
      },
    });
    
  } catch (error) {
    console.error(error);
    req.flash('error', 'An error occurred while updating the category.');
    res.redirect('/');
  }
};


// DELETE /category/:id
// Delete a category and its associated posts

exports.deleteCategory = async (req, res) => {
  try {
    const catId = req.params.id;
    const category = await Category.findById(catId);

    if (!category) {
      const notFoundMessage = 'Category not found';
      return res.status(404).json({ message: notFoundMessage });
    }

    // Find and delete all posts associated with the category
    await Post.deleteMany({ category: category.name });

    const result = await Category.deleteOne({ _id: catId });

    if (result.deletedCount > 0) {
      const successMessage = 'Category and associated posts deleted successfully';
      return res.status(200).json({ message: successMessage });

    } else {
      const errorMessage = 'Failed to delete category';
      return res.status(500).json({ message: errorMessage });
    }

  } catch (error) {
    const errorMessage = error.message || 'An error occurred';
    return res.status(500).json({ message: errorMessage });
  }
};

/**
 * POST /search
 * (see models/Post for text indexes);
*/
exports.searchPost = async(req, res) => {

  try {
    let searchTerm = req.body.searchTerm;
    console.log('Search Term:', searchTerm);
    let post = await Post.find( { $text: { $search: searchTerm, $caseSensitive: false, $diacriticSensitive: true }});
    console.log(post);

    res.render('search', { 
      title: 'SmartEco4Future - Search',
      excludeHeader: true, 
      post      
     });

  } catch (error) {
    res.satus(500).send({message: error.message || "An error occured" });
  }
  
}
