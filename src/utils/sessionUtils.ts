export const checkUserSession = (): boolean => {
  const userData = localStorage.getItem('userData');
  return userData !== null;
};

export const getUserData = () => {
  const userData = localStorage.getItem('userData');
  return userData ? JSON.parse(userData) : null;
};