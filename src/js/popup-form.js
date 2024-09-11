function showPopupForm(form) {
  form.style.width = '50%';
  form.style.zIndex = 1000; // This makes it popup
  form.style.position = 'fixed';
  form.style.top = '50%';
  form.style.left = '50%';
  form.style.transform = 'translate(-50%, -50%)';

	if (form) {
    document.body.appendChild(form);
		form.style.display = 'block';
		return;
	}
}
