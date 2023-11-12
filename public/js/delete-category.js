const deleteCategoryPage = document.querySelector('.cat-title');

if (deleteCategoryPage) {

  const deleteButtons = document.querySelectorAll(".del-cat");

  deleteButtons.forEach(async (button) => {
    
    button.addEventListener("click", async () => {
      const catId = button.getAttribute("data-catid");
      const success = document.querySelector('.del-cat-success');
      const error = document.querySelector('.del-cat-error'); 

      // Hide both divs at the beginning of each button click
      success.style.visibility = "hidden";
      error.style.visibility = "hidden";

      console.log("Deleting cat with ID:", catId);

      try {
        const response = await fetch(`/category/${catId}`, {
          method: "DELETE",
        });

        console.log("Response status:", response.status);
        if (response.status === 200) {
          success.style.visibility = "visible";
          success.textContent = 'The category was deleted.';
          error.style.visibility = "hidden";
         
          // Delay the redirection by 1 second
          setTimeout(() => {
            window.location.href = '/categories';
          }, 1000);

        } else {
          console.error("Error deleting category:", response.status);
          error.style.visibility = "visible";
          error.textContent = 'Error deleting category.';
        }

      } catch (error) {
        console.error("Error deleting category:", error);
        error.style.visibility = "visible";
        error.textContent = 'Error deleting category.';
      }
    });
  });
}
