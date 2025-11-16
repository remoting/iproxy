// 替换为 Gemini API 的官方基准 URL
const GEMINI_API_BASE_URL = 'https://generativelanguage.googleapis.com';

export default {
    // 💡 注意：如果你决定从 env.API_KEY 获取密钥，你需要更新 fetch 函数签名
    // 但因为你选择取消 API Key 注入，所以我们只保留 request 参数
    async fetch(request) { 
        // 1. 获取请求的 URL 路径和查询参数
        const url = new URL(request.url);
        
        // 简单的反向代理逻辑：直接使用请求的路径和所有查询参数 (包括客户端可能携带的 key)
        const apiPath = url.pathname;
        const searchParams = url.search; 

        // 2. 构造目标 API URL
        // 目标 URL 格式：https://generativelanguage.googleapis.com/v1beta/models/...
        const targetUrl = `${GEMINI_API_BASE_URL}${apiPath}${searchParams}`;
        
        // 3. 处理 CORS 预检请求 (OPTIONS)
        if (request.method === 'OPTIONS') {
            return handleCorsPreflight(request);
        }

        // 4. 克隆请求并修改目标 URL
        // 必须创建一个新请求来修改 URL，并确保复制所有属性（如请求体和所有 Header）
        // 这里没有修改 Headers，确保客户端传入的 Authorization 或 key 头可以转发
        const newRequest = new Request(targetUrl, {
            method: request.method,
            headers: request.headers,
            body: request.body, // 保留请求体
            redirect: request.redirect,
        });

        // 5. 转发请求到 Gemini API
        try {
            const response = await fetch(newRequest);

            // 6. 处理响应，添加 CORS 头部
            const newHeaders = new Headers(response.headers);
            newHeaders.set('Access-Control-Allow-Origin', '*'); // 允许所有来源，生产环境建议限定
            newHeaders.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');

            // 7. 返回修改后的响应
            return new Response(response.body, {
                status: response.status,
                statusText: response.statusText,
                headers: newHeaders,
            });
        } catch (error) {
            console.error("Fetch error:", error);
            return new Response(`Proxy error: ${error.message}`, { status: 500 });
        }
    }
};

// 辅助函数：处理 CORS 预检请求
function handleCorsPreflight(request) {
    const headers = request.headers;
    return new Response(null, {
        status: 204,
        headers: {
            'Access-Control-Allow-Origin': headers.get('Origin') || '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            // 注意：这里保留了 Content-Type 和 X-Api-Key，以防客户端使用这些头来传递信息
            'Access-Control-Allow-Headers': headers.get('Access-Control-Request-Headers') || 'Content-Type, X-Api-Key, Authorization', 
            'Access-Control-Max-Age': '86400', // 缓存预检结果 24 小时
        },
    });
}