const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

function resolveAssetUrl(assetUrl?: string): string {
  if (!assetUrl) return '';
  if (assetUrl.startsWith('http://') || assetUrl.startsWith('https://')) return assetUrl;
  if (!API_BASE_URL) return assetUrl;

  try {
    return new URL(assetUrl, API_BASE_URL).toString();
  } catch {
    return assetUrl;
  }
}

interface ApiResponse<T> {
  data?: T;
  error?: string;
}

// Global rate limit handler
let rateLimitHandler: ((retryAfter?: number) => void) | null = null;

export function setRateLimitHandler(handler: (retryAfter?: number) => void) {
  rateLimitHandler = handler;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

interface BackendResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  pagination?: PaginationInfo;
  errors?: unknown;
  error?: unknown;
}

interface BackendAuthUser {
  id?: string;
  _id?: string;
  name?: string;
  email?: string;
  avatar?: string;
}

interface BackendBlog {
  _id?: string;
  id?: string;
  slug?: string;
  title?: string;
  description?: string;
  content?: string;
  tags?: string[];
  cover_image?: string;
  user_id?: {
    _id?: string;
    id?: string;
    name?: string;
    avatar?: string;
  };
  author?: {
    id: string;
    name: string;
    avatar?: string;    
  };
  status?: 'draft' | 'published';
  impression?: number;
  views?: number;
  createdAt?: string;
  updatedAt?: string;
}

function transformAuthUser(user: BackendAuthUser | undefined): UserProfile {
  return {
    id: user?.id || user?._id || '',
    name: user?.name || '',
    email: user?.email || '',
    avatar: user?.avatar || '',
  };
}

// Transform backend blog object to frontend format
function transformBlog(backendBlog: BackendBlog): Blog {
  return {
    id: backendBlog._id || backendBlog.id || '',
    slug: backendBlog.slug || '',
    title: backendBlog.title || '',
    description: backendBlog.description || '',
    content: backendBlog.content || '',
    tags: backendBlog.tags || [],
    coverImage: backendBlog.cover_image || '',
    author: {
      id: backendBlog.user_id?._id || backendBlog.user_id?.id || '',
      name: backendBlog.user_id?.name || 'Unknown',
      avatar: resolveAssetUrl(backendBlog.user_id?.avatar),
    },
    status: backendBlog.status || 'published',
    rejectionReason: backendBlog.rejectionReason,
    views: backendBlog.impression || backendBlog.views || 0,
    createdAt: backendBlog.createdAt || '',
    updatedAt: backendBlog.updatedAt || '',
  };
}

async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const token = localStorage.getItem('auth_token');

  const headers: HeadersInit = {
    ...options.headers,
  };

  const isFormDataBody = typeof FormData !== 'undefined' && options.body instanceof FormData;
  if (!isFormDataBody) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    // Handle 429 Too Many Requests
    if (response.status === 429) {
      const retryAfterHeader = response.headers.get('Retry-After');
      const retryAfter = retryAfterHeader ? parseInt(retryAfterHeader, 10) : undefined;
      
      if (rateLimitHandler) {
        rateLimitHandler(retryAfter);
      }
      
      return {
        error: 'Too many requests. Please slow down and try again.',
      };
    }

    const responseData: BackendResponse<unknown> = await response.json().catch(() => ({
      success: false,
      message: 'Invalid response format',
    }));

    if (!response.ok || !responseData.success) {
      const errorMessage = 
        (typeof responseData.message === 'string' ? responseData.message : null) ||
        (typeof responseData.error === 'string' ? responseData.error : null) ||
        `Error: ${response.status}`;
      return {
        error: errorMessage,
      };
    }

    return { data: responseData.data as T };
  } catch (error) {
    return { error: 'Network error. Please try again.' };
  }
}

// Helper function to get full backend response (including pagination)
async function apiRequestWithPagination(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ data?: BackendResponse<BackendBlog[]>; error?: string }> {
  const token = localStorage.getItem('auth_token');
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    // Handle 429 Too Many Requests
    if (response.status === 429) {
      const retryAfterHeader = response.headers.get('Retry-After');
      const retryAfter = retryAfterHeader ? parseInt(retryAfterHeader, 10) : undefined;
      
      if (rateLimitHandler) {
        rateLimitHandler(retryAfter);
      }
      
      return {
        error: 'Too many requests. Please slow down and try again.',
      };
    }

    const responseData: BackendResponse<BackendBlog[]> = await response.json().catch(() => ({
      success: false,
      message: 'Invalid response format',
    }));

    if (!response.ok || !responseData.success) {
      const errorMessage = 
        (typeof responseData.message === 'string' ? responseData.message : null) ||
        (typeof responseData.error === 'string' ? responseData.error : null) ||
        `Error: ${response.status}`;
      return {
        error: errorMessage,
      };
    }

    return { data: responseData };
  } catch (error) {
    return { error: 'Network error. Please try again.' };
  }
}

// Auth API
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: UserProfile;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  password: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar: string;
}

export const authApi = {
  login: async (data: LoginRequest) => {
    const response = await apiRequest<{
      token: string;
      user: BackendAuthUser;
    }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    if (response.error) {
      return { error: response.error };
    }

    return {
      data: {
        token: response.data!.token,
        user: transformAuthUser(response.data!.user),
      },
    };
  },

  register: (data: RegisterRequest) =>
    apiRequest<{ message: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  forgotPassword: (data: ForgotPasswordRequest) =>
    apiRequest<{ message: string }>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  resetPassword: (data: ResetPasswordRequest) =>
    apiRequest<{ message: string }>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

export interface UpdateProfileRequest {
  name: string;
  avatar?: File | null;
}

export const profileApi = {
  getMyProfile: async () => {
    const response = await apiRequest<{ user: BackendAuthUser }>('/auth/me');

    if (response.error) {
      return { error: response.error };
    }

    return {
      data: transformAuthUser(response.data!.user),
    };
  },

  updateMyProfile: async (data: UpdateProfileRequest) => {
    const formData = new FormData();
    formData.append('name', data.name);

    if (data.avatar) {
      formData.append('avatar', data.avatar);
    }

    const response = await apiRequest<{ user: BackendAuthUser }>('/auth/me', {
      method: 'PUT',
      body: formData,
    });

    if (response.error) {
      return { error: response.error };
    }

    return {
      data: transformAuthUser(response.data!.user),
    };
  },
};

// Blog API
export interface Blog {
  id: string;
  slug: string;
  title: string;
  description: string;
  content: string;
  tags: string[];
  coverImage: string;
  author: {
    id: string;
    name: string;
    avatar: string;
  };
  status: 'draft' | 'published' | 'pending_approval' | 'rejected';
  rejectionReason?: string;
  views: number;
  createdAt: string;
  updatedAt: string;
}

export interface BlogListResponse {
  blogs: Blog[];
  page: number;
  totalPages: number;
  total: number;
}

export interface CreateBlogRequest {
  title: string;
  description: string;
  content: string;
  tags: string[];
  coverImage?: string;
  status?: 'draft' | 'published';
}

export interface UpdateBlogRequest {
  title?: string;
  description?: string;
  content?: string;
  tags?: string[];
  coverImage?: string;
  status?: 'draft' | 'published';
}

export const blogApi = {
  getBlogs: async (page = 1, status = 'published', tag = '') => {
    const response = await apiRequestWithPagination(
      `/blog?page=${page}&status=${status}${tag ? `&tag=${tag}` : ''}`
    );
    
    if (response.error) {
      return { error: response.error };
    }

    // Backend returns: { success: true, message: "...", data: [...], pagination: {...} }
    const backendResponse = response.data!;
    const blogsArray = Array.isArray(backendResponse.data) 
      ? backendResponse.data 
      : [];
    
    const blogs = blogsArray.map(transformBlog);
    const pagination: PaginationInfo = backendResponse.pagination || {
      page,
      limit: 10,
      total: blogs.length,
      pages: 1,
    };
    
    return {
      data: {
        blogs,
        page: pagination.page,
        totalPages: pagination.pages,
        total: pagination.total,
      },
    };
  },

  getBlogBySlug: async (slug: string) => {
    const response = await apiRequest<BackendBlog>(`/blog/${slug}`);
    
    if (response.error) {
      return { error: response.error };
    }

    return {
      data: transformBlog(response.data),
    };
  },

  getMyBlogs: async (page = 1) => {
    const response = await apiRequestWithPagination(
      `/blog/my-blogs?page=${page}`
    );
    
    if (response.error) {
      return { error: response.error };
    }

    // Backend returns: { success: true, message: "...", data: [...], pagination: {...} }
    const backendResponse = response.data!;
    const blogsArray = Array.isArray(backendResponse.data) 
      ? backendResponse.data 
      : [];
    
    const blogs = blogsArray.map(transformBlog);
    const pagination: PaginationInfo = backendResponse.pagination || {
      page,
      limit: 10,
      total: blogs.length,
      pages: 1,
    };
    
    return {
      data: {
        blogs,
        page: pagination.page,
        totalPages: pagination.pages,
        total: pagination.total,
      },
    };
  },

  createBlog: async (data: CreateBlogRequest) => {
    // Transform camelCase to snake_case for backend
    const backendData: {
      title: string;
      description: string;
      content: string;
      tags: string[];
      status?: 'draft' | 'published';
      cover_image?: string;
    } = {
      title: data.title,
      description: data.description,
      content: data.content,
      tags: data.tags,
      status: data.status,
    };
    if (data.coverImage) {
      backendData.cover_image = data.coverImage;
    }
    
    const response = await apiRequest<BackendBlog>('/blog', {
      method: 'POST',
      body: JSON.stringify(backendData),
    });
    
    if (response.error) {
      return { error: response.error };
    }

    return {
      data: transformBlog(response.data),
    };
  },

  updateBlog: async (slug: string, data: UpdateBlogRequest) => {
    // Transform camelCase to snake_case for backend
    const backendData: {
      title?: string;
      description?: string;
      content?: string;
      tags?: string[];
      status?: 'draft' | 'published';
      cover_image?: string;
    } = {};
    if (data.title !== undefined) backendData.title = data.title;
    if (data.description !== undefined) backendData.description = data.description;
    if (data.content !== undefined) backendData.content = data.content;
    if (data.tags !== undefined) backendData.tags = data.tags;
    if (data.status !== undefined) backendData.status = data.status;
    if (data.coverImage !== undefined) backendData.cover_image = data.coverImage;
    
    const response = await apiRequest<BackendBlog>(`/blog/${slug}`, {
      method: 'PUT',
      body: JSON.stringify(backendData),
    });
    
    if (response.error) {
      return { error: response.error };
    }

    return {
      data: transformBlog(response.data),
    };
  },

  searchTags: async (query: string) => {
    const response = await apiRequest<Array<{ tag: string; count: number } | string>>(
      `/blog/tags/search?q=${encodeURIComponent(query)}`
    );
    
    if (response.error) {
      return { error: response.error };
    }

    // Transform tag objects to string array
    const tags = Array.isArray(response.data)
      ? response.data.map((item) => {
          if (typeof item === 'string') return item;
          if (typeof item === 'object' && item !== null && 'tag' in item) {
            return item.tag;
          }
          return String(item);
        })
      : [];
    
    return { data: tags };
  },
};

// Comment API
export interface CommentAuthor {
  id: string;
  name: string;
  username: string;
  avatar: string | null;
}

export interface Comment {
  id: string;
  author: CommentAuthor;
  content: string;
  depth: number;
  status: 'active' | 'pending_review' | 'hidden' | 'deleted';
  spam_report_count: number;
  is_auto_flagged?: boolean;
  createdAt: string;
  updatedAt: string;
  canReply: boolean;
  replies: Comment[];
  moderated_by?: {
    id: string;
    name: string;
    username: string;
  };
  moderated_at?: string;
  moderation_reason?: string;
}

export interface CommentsResponse {
  comments: Comment[];
  pagination: PaginationInfo;
}

export interface CreateCommentRequest {
  content: string;
}

export interface ReplyCommentRequest {
  content: string;
}

export interface ReportCommentRequest {
  reason: 'spam' | 'offensive' | 'harassment' | 'other';
}

function transformComment(comment: Comment): Comment {
  return {
    ...comment,
    author: {
      ...comment.author,
      avatar: comment.author?.avatar ? resolveAssetUrl(comment.author.avatar) : null,
    },
    replies: Array.isArray(comment.replies)
      ? comment.replies.map(transformComment)
      : [],
  };
}

export const commentApi = {
  /**
   * Get all comments for a blog post (nested tree structure)
   * GET /api/blogs/:slug/comments
   */
  getComments: async (slug: string, page = 1, limit = 50) => {
    const response = await apiRequest<Comment[]>(
      `/api/blogs/${slug}/comments?page=${page}&limit=${limit}`
    );
    
    if (response.error) {
      return { error: response.error };
    }

    // Get full response with pagination
    const token = localStorage.getItem('auth_token');
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const fullResponse = await fetch(
        `${API_BASE_URL}/api/blogs/${slug}/comments?page=${page}&limit=${limit}`,
        { headers }
      );

      if (fullResponse.status === 429) {
        const retryAfterHeader = fullResponse.headers.get('Retry-After');
        const retryAfter = retryAfterHeader ? parseInt(retryAfterHeader, 10) : undefined;
        if (rateLimitHandler) {
          rateLimitHandler(retryAfter);
        }
        return {
          error: 'Too many requests. Please slow down and try again.',
        };
      }

      const responseData: BackendResponse<Comment[]> = await fullResponse.json().catch(() => ({
        success: false,
        message: 'Invalid response format',
      }));

      if (!fullResponse.ok || !responseData.success) {
        const errorMessage = 
          (typeof responseData.message === 'string' ? responseData.message : null) ||
          (typeof responseData.error === 'string' ? responseData.error : null) ||
          `Error: ${fullResponse.status}`;
        return {
          error: errorMessage,
        };
      }

      return {
        data: {
          comments: Array.isArray(responseData.data)
            ? responseData.data.map(transformComment)
            : [],
          pagination: responseData.pagination || {
            page,
            limit,
            total: 0,
            pages: 0,
          },
        },
      };
    } catch (error) {
      return { error: 'Network error. Please try again.' };
    }
  },

  /**
   * Create a new top-level comment
   * POST /api/blogs/:slug/comments
   */
  createComment: async (slug: string, data: CreateCommentRequest) => {
    const response = await apiRequest<Comment>(`/api/blogs/${slug}/comments`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    
    if (response.error) {
      return { error: response.error };
    }

    return {
      data: transformComment(response.data!),
    };
  },

  /**
   * Reply to an existing comment
   * POST /api/comments/:commentId/reply
   */
  replyToComment: async (commentId: string, data: ReplyCommentRequest) => {
    const response = await apiRequest<Comment>(`/api/comments/${commentId}/reply`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    
    if (response.error) {
      return { error: response.error };
    }

    return {
      data: transformComment(response.data!),
    };
  },

  /**
   * Delete own comment (soft delete)
   * DELETE /api/comments/:commentId
   */
  deleteComment: async (commentId: string) => {
    const response = await apiRequest<{ message: string }>(`/api/comments/${commentId}`, {
      method: 'DELETE',
    });
    
    if (response.error) {
      return { error: response.error };
    }

    return {
      data: response.data!,
    };
  },

  /**
   * Report a comment as spam/offensive
   * POST /api/comments/:commentId/report
   */
  reportComment: async (commentId: string, data: ReportCommentRequest) => {
    const response = await apiRequest<{
      status: string;
      spam_report_count: number;
    }>(`/api/comments/${commentId}/report`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    
    if (response.error) {
      return { error: response.error };
    }

    return {
      data: response.data!,
    };
  },
};
