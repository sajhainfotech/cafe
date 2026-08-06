export const showToast = (code, status, message) => {
  if (code === 200 || status == "success") {
    toast.success(message);
  } else {
    toast.error(message);
  }
};
