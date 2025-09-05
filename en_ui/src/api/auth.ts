import request from '@/utils/request';

// 类型定义
interface LoginData {
    username: string;
    password: string;
}

interface RegisterData {
    username: string;
    password: string;
}

interface ChangeInfoData {
    username?: string;
    password?: string;
    planStudyWords?: number;
    planReviweWords?: number;
    question_completed?: boolean;
    ai_choose_completed?: boolean;
}

interface ApiResponse<T = any> {
    data: {
        code: number;
        message: string;
    } & T;
}

interface UserInfo {
    username: string;
    creatTime: string;
    cet4: {
        position: string;
        lastStudyTime: string;
        learnedWords: number;
        todayStudiedWords: number;
        streakDays: number;
        lastStudyDate: string;
    };
    todayWords: number;
    streakDays: number;
    totalWords: number;
    planStudyWords: number;
    planReviweWords: number;
    question_completed: boolean;
    ai_choose_completed: boolean;
}

function login(data: LoginData): Promise<ApiResponse> {
    return request.post('/auth/login', data);
}

function register(data: RegisterData): Promise<ApiResponse> {
    return request.post('/auth/register', data);
}

function logout(): Promise<ApiResponse> {
    return request.post('/auth/logout');
}

function getUserInfo(): Promise<ApiResponse<UserInfo>> {
    return request.get('/auth/info');
}

function changeInfo(data: ChangeInfoData): Promise<ApiResponse> {
    return request.post('/auth/changeinfo', data);
}

export { login, register, logout, getUserInfo, changeInfo };
export type { LoginData, RegisterData, ChangeInfoData, ApiResponse, UserInfo };
