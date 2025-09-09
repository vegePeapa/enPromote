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

// axios 实际返回的响应结构
interface AxiosApiResponse<T = any> {
    data: ApiResponse<T>;
    status: number;
    statusText: string;
    headers: any;
    config: any;
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
        // 移除冗余的关卡状态字段
    };
    todayWords: number;
    streakDays: number;
    totalWords: number;
    planStudyWords: number;
    planReviweWords: number;
    question_completed: boolean;
    ai_choose_completed: boolean;
    // 统一使用 chapters 管理关卡状态
    chapters: {
        [key: string]: {
            level: number;
            score: number;
            completedWords: number;
            wordP: boolean;
            spellP: boolean;
            listenP: boolean;
            customsP: boolean;
            coverP: boolean;
        };
    };
    currentChapter: string;
}

function login(data: LoginData): Promise<AxiosApiResponse> {
    return request.post('/auth/login', data);
}

function register(data: RegisterData): Promise<AxiosApiResponse> {
    return request.post('/auth/register', data);
}

function logout(): Promise<AxiosApiResponse> {
    return request.post('/auth/logout');
}

function getUserInfo(): Promise<AxiosApiResponse<UserInfo>> {
    return request.get('/auth/info');
}

function changeInfo(data: ChangeInfoData): Promise<AxiosApiResponse> {
    return request.post('/auth/changeinfo', data);
}

function switchChapter(chapter: string): Promise<AxiosApiResponse> {
    return request.post('/auth/switch-chapter', { chapter });
}

export { login, register, logout, getUserInfo, changeInfo, switchChapter };
export type { LoginData, RegisterData, ChangeInfoData, ApiResponse, AxiosApiResponse, UserInfo };
