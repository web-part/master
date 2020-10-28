
/**
* 
*/
define('HtmlLink/Meta', function (require, module, exports) {
    const ID = require('ID');

    return {
        create(config, others) {
            let { regexp, changeDelay, content, file, parent, } = config;
            let id = ID.next(module.parent.id);

            let meta = {
                'id': id,                           //实例 id。
                'regexp': regexp,                   //提取的正则表达式。 在子模块 Parser 中用到。
                'changeDelay': changeDelay,         //多个下级在指定时间内的多次 change 只会触发当前实例的一次 `change` 事件。
                'file': file,                       //文件路径。
                'dir': '',                          //当前 html 片段页所在的目录，由下级模块 Parse 解析取得。
                'content': content || '',           //当前 html 片段的内容。
                'lines': [],                        //content 按行分裂的数组。
                'list': [],                         //下级实例列表。
                'old': {                            //重新解析前对一些字段的备份。
                    'file$link': {},                //
                },

                'file$link': {},                    //文件名对应的下级 Link 实例。    
                'key$output': {},                   //缓存 this.html(options) 输出。 key = JSON.stringify(options);

                '$': null,                          //cheerio 实例。
                'parent': parent || null,           //所属于的父节点。
                'this': null,                       //方便内部引用自身的实例。
                'emitter': null,                    //事件驱动器。
                'watcher': null,                    //Watcher 实例。


                change(timeout) {
                    timeout ? setTimeout(change, timeout) : change();

                    function change() {
                        let emitter = meta.emitter;
                        emitter && emitter.fire('change');
                    }
                },


            };


            Object.assign(meta, others);

            return meta;
        },

        /**
        * 重置。
        */
        reset(meta) {
            meta.old.file$link = meta.file$link;

            Object.assign(meta, {
                'content': '',
                '$': null,
                'list': [],
                'lines': [],
                'file$link': {},
                'key$output': {},
            });
        },


    };
    
});


