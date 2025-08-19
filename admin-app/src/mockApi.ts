// Mock API for testing user registration without backend dependencies

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  phone: string;
  dateOfBirth: string;
}

interface LoginRequest {
  email: string;
  password: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  isVerified: boolean;
  isActive: boolean;
  createdAt: string;
}

interface AuthResponse {
  user: User;
  token: string;
  message: string;
}

// Simple in-memory storage for development
const mockUsers: User[] = [];
let userIdCounter = 1;

export const mockApiService = {
  async register(userData: RegisterRequest): Promise<ApiResponse<AuthResponse>> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // Check if user already exists
    const existingUser = mockUsers.find(user => user.email === userData.email);
    if (existingUser) {
      return {
        success: false,
        error: 'User with this email already exists'
      };
    }

    // Create new user
    const newUser: User = {
      id: userIdCounter.toString(),
      name: userData.name,
      email: userData.email,
      phone: userData.phone,
      role: 'CUSTOMER',
      isVerified: true, // Set as verified by default for immediate access
      isActive: true,
      createdAt: new Date().toISOString()
    };

    userIdCounter++;
    mockUsers.push(newUser);

    // Generate mock JWT token
    const token = `mock-jwt-token-${newUser.id}-${Date.now()}`;

    console.log('✅ Mock user registered:', newUser);

    return {
      success: true,
      data: {
        user: newUser,
        token,
        message: 'User registered successfully'
      },
      message: 'User registered successfully'
    };
  },

  async login(email: string, password: string): Promise<ApiResponse<AuthResponse>> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // Find user
    const user = mockUsers.find(u => u.email === email);
    if (!user) {
      return {
        success: false,
        error: 'Invalid email or password'
      };
    }

    // In a real API, we'd verify the password hash
    // For mock, we'll just check if password is not empty
    if (!password || password.trim() === '') {
      return {
        success: false,
        error: 'Invalid email or password'
      };
    }

    // Generate mock JWT token
    const token = `mock-jwt-token-${user.id}-${Date.now()}`;

    console.log('✅ Mock user logged in:', user);

    return {
      success: true,
      data: {
        user,
        token,
        message: 'Login successful'
      },
      message: 'Login successful'
    };
  },

  // Helper function to check if mock mode should be used
  isMockMode(): boolean {
    return process.env.NODE_ENV === 'development' && process.env.REACT_APP_USE_MOCK_API === 'true';
  },

  // Get all users (for testing)
  getUsers(): User[] {
    return mockUsers;
  }
};
