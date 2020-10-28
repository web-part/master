
define('LessLink.defaults', {
    /**
    * 用来提取出引用了 less 文件的 link 标签的正则表达式。
    * 如 `<link rel="less" href="style/demo.less" />`。
    */
    regexp: /<link\s+.*rel\s*=\s*["\']less["\'].*\/>/ig,
});