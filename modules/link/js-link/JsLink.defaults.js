
define('JsLink.defaults', {
    /**
    * 用来提取出引用了 js 文件的 script 标签的正则表达式。
    */
    regexp: /<script\s+.*src\s*=\s*[^>]*?>[\s\S]*?<\/script>/gi,
});