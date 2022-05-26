
define('WebSite.defaults', {
    //网站的根目录。 相对于 bin 目录。
    htdocs: 'htdocs/',

    //样式目录。 相对于网站根目录。
    css: 'style/css/',


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
        enabled: false,                     //是否启用 pack 分包功能。        
        dest: {
            dir: 'packages/items/',         //分包资源输出的目录。
            file: 'packages/all.json',      //总包输出的文件。 必须要与 definejs 框架的配置一致。
        },

        patterns: [     //通过指定 patterns 为空数组或去掉，可以禁用分包打包功能。

        ],   
    },

});