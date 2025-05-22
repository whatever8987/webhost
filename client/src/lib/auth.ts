import { API } from "./api";
import { queryClient } from "./queryClient";

export async function login(username: string, password: string) {
  try {
    const response = await API.auth.login({ username, password });
    // Set tokens if your API returns them
    if (response.data.access && response.data.refresh) {
      localStorage.setItem('access_token', response.data.access);
      localStorage.setItem('refresh_token', response.data.refresh);
    }
    await queryClient.invalidateQueries({ queryKey: ["userProfile"] });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Failed to login");
  }
}

export async function logout() {
  try {
    await API.auth.logout();
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    queryClient.invalidateQueries({ queryKey: ["userProfile"] });
  } catch (error) {
    console.error("Logout error:", error);
    // Ensure we clear tokens even if logout API fails
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    queryClient.invalidateQueries({ queryKey: ["userProfile"] });
  }
}

export async function register(userData: {
  username: string;
  email: string;
  password: string;
  phone_number?: string;
}) {
  try {
    const response = await API.auth.register({
      username: userData.username,
      email: userData.email,
      password: userData.password,
      password2: userData.password, // Assuming your API requires password confirmation
      phone_number: userData.phone_number
    });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Failed to register");
  }
}

export async function getCurrentUser() {
  try {
    const response = await API.user.getProfile();
    return response.data;
  } catch (error) {
    if (error.response?.status === 401) {
      // Token is invalid or expired
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
    }
    return null;
  }
}

export async function updateUserProfile(userData: Partial<User>) {
  try {
    const response = await API.user.updateProfile(userData);
    await queryClient.invalidateQueries({ queryKey: ["userProfile"] });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Failed to update profile");
  }
}

export async function changePassword(
  currentPassword: string,
  newPassword: string
) {
  try {
    await API.auth.changePassword({
      current_password: currentPassword,
      new_password: newPassword,
      new_password2: newPassword // Assuming your API requires password confirmation
    });
  } catch (error) {
    throw new Error(error.response?.data?.message || "Failed to change password");
  }
}