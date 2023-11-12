const deleteButtons = document.querySelectorAll(".btn-danger.del");

deleteButtons.forEach(async (button) => {
  button.addEventListener("click", async () => {
    const postId = button.getAttribute("data-postid");
    const success = button.nextElementSibling; 
    const error = success.nextElementSibling; 

    // Hide both divs at the beginning of each button click
    success.style.visibility = "hidden";
    error.style.visibility = "hidden";

    console.log("Deleting post with ID:", postId);

    try {
      const response = await fetch(`/post/${postId}`, {
        method: "DELETE",
      });

      console.log("Response status:", response.status);
      if (response.status === 200) {
        success.style.visibility = "visible";
        success.textContent = 'The post was deleted.';
        error.style.visibility = "hidden"; 
        
        // Delay the redirection by 1 second
        setTimeout(() => {
          window.location.href = '/';
        }, 1000);


      } else {
        console.error("Error deleting post:", response.status);
        error.style.visibility = "visible";
        error.textContent = 'Error deleting post.';
      }

    } catch (error) {
      console.error("Error deleting post:", error);
      error.style.visibility = "visible";
      error.textContent = 'Error deleting post.';
    }
  });
});
