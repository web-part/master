
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
});