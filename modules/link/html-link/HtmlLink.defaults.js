
define('HtmlLink.defaults', {
    /**
    * 用来提取出引用了 html 片段文件的标签的正则表达式。
    */
    regexp: /<link\s+.*rel\s*=\s*["\']html["\'].*\/>/ig,
    
    /**
    * 多个下级在以下指定时间内的多次 change 只会触发当前实例的一次 `change` 事件。
    */
    changeDelay: 500,

});