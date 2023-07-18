
/**
* 通用的默认配置参数。
* 即使什么也不修改，它也能适应大多数情况而运行得很好。
* 一般情况下不建议修改，除非你知道自己在做什么。
*/
module.exports = {
    //网站的根目录。 
    htdocs: 'htdocs/',

    //文件版本。
    edition: {
        debug: '.debug',
        min: '.min',
    },

    less: {
        /**
        * 用来提取出引用了 less 文件的 link 标签的正则表达式。
        * 如 `<link rel="less" href="style/demo.less" />`。
        */
        regexp: /<link\s+.*rel\s*=\s*["\']less["\'].*\/>/ig,
    },

    css: {
        //样式目录，相对于网站根目录。
        dir: 'style/css/',

        //渲染生成样式资源标签所需要的 html 模板。
        sample: '<link rel="stylesheet" href="{href}"{props} />',

        //用来从母版页中提取出 css 标签的正则表达式。
        regexp: /<link\s+.*rel\s*=\s*["\']stylesheet["\'].*\/>/ig,
    },

    js: {
        //压缩过程中发生错误时，需要写入的压缩前、合并后的源文件。
        //如果不指定，则不生成该文件。
        //输出该文件有助于排查错误。
        error: 'all.error.debug.js',   

        //渲染生成脚本资源标签所需要的 html 模板。
        sample: '<script src="{href}"{props}></script>',

        /**
        * 用来提取出引用了 js 文件的 script 标签的正则表达式。
        */
        regexp: /<script\s+.*src\s*=\s*[^>]*?>[\s\S]*?<\/script>/gi,

    },

    html: {
        /**
        * 用来提取出引用了 html 片段文件的标签的正则表达式。
        */
        regexp: /<link\s+.*rel\s*=\s*["\']html["\'].*\/>/ig,

        /**
        * 多个下级在以下指定时间内的多次 change 只会触发当前实例的一次 `change` 事件。
        */
        changeDelay: 500,

        minify: {
            /**
            * 折叠空白。 
            * 即删除空行、空格等，是压缩最重要的体现。
            */
            collapseWhitespace: true,

            /**
             * 保留闭合斜线。
             */
            keepClosingSlash: true,
        },
    },

    metaProps: {
        key: 'webpart',
        spliter: ';',       //分组之间的分隔符。
        seperator: ':',     //组内的键值对之间的分隔符。 如 `a=1;b=2;`，则 spliter 为 `;`，seperator 为 `=`。
    },

    //监控器。
    watcher: {
        debounceDelay: 500,     //把一定时间段内的多个变化合成一个变化，避免触发过多的事件。
        maxListeners: 9999,     //最大的监听器。

        /**
        * 监控的轮询时间间隔。 
        * 如果设置得太小而文件数过多，则 CPU 占用很高。 
        * 比如设为 100 时， 2000 多个文件可高达 60%。
        */
        interval: 300,
    },


    //标记批量动态引入 less、html、js 的区块的开始标记和结束标记。 
    tags: {
        less: {
            begin: '<!--webpart.less.begin-->',
            end: '<!--webpart.less.end-->',
        },
        html: {
            begin: '<!--webpart.html.begin-->',
            end: '<!--webpart.html.end-->',
        },
        js: {
            begin: '<!--webpart.js.begin-->',
            end: '<!--webpart.js.end-->',
        },
    },

    //通过指定 masters 为 null 或去掉，可以禁用母版页功能。
    masters: {
        enabled: true,          //是否启用母版页功能。
        dest: '{name}.html',    //输出的目标页面，如 `index.master.html` 则输出为 `index.html`。
        patterns: [
            '**/*.master.html',
        ],

    },

    //同时要指定该配置节点，以在无 pack 版本的命令中把之前生成的 packages 目录等资源清掉。
    packages: {
        enabled: false,                      //是否启用 pack 分包功能。        
        dest: {
            file: 'packages/all.json',      //总包输出的文件。 必须要与 KISP 的配置一致。
            dir: 'packages/items/',         //分包资源输出的目录。
        },

        patterns: [     //通过指定 patterns 为空数组或去掉，可以禁用分包打包功能。

        ],
    },


};