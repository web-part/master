
define('Js.defaults', {
    //压缩发生错误时，需要写入的压缩前、合并后的源文件。
    //如果不指定，则不生成该文件。
    error: 'all.error.debug.js',    

    //渲染生成脚本资源标签所需要的 html 模板。
    sample: '<script src="{href}"{props}></script>',

});