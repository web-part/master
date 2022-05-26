
define('MasterPage.defaults', {
    //标记批量动态引入 less、html、js 的区块的开始标记和结束标记。 
    tags: {
        less: {
            begin: '<!--master.less.begin-->',
            end: '<!--master.less.end-->',
        },
        html: {
            begin: '<!--master.html.begin-->',
            end: '<!--master.html.end-->',
        },
        js: {
            begin: '<!--master.js.begin-->',
            end: '<!--master.js.end-->',
        },
    },

    //生成 html 时添加到 href|src 中 query 部分的 md5 的长度。
    //可取的值为 0 到 32，如果指定为 true，则等价于指定为 32;
    //如果指定为 0 或 false，则不生成 md5 的 query 部分。
    md5: {
        css: 4,
        less: 4,
        js: 4,
    },
});