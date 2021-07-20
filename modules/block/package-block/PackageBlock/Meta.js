/**
* 
*/
define('PackageBlock/Meta', function (require, module, exports) {
    const Patterns = require('@definejs/patterns');
    const ID = require('ID');


    return {

        create(config, others) {
            let tid = null;
            let htdocs = config.htdocs;
            let dest = config.dest;
            let patterns = config.patterns || [];

            if (!Array.isArray(patterns)) {
                patterns = [patterns];
            }

            patterns.push('!' + dest.file);             //要把输出的总包排除掉。

            patterns = Patterns.join(htdocs, patterns);
            
            let id = ID.next(module.parent.id);

            let meta = {
                'id': id,                           //实例 id。
                'htdocs': htdocs,                   //网站的根目录。
                'css': config.css,                  //样式目录，相对于网站根目录。
                'patterns': patterns,               //路径模式。

                'dest': {
                    'file': htdocs + dest.file,
                    'dir': htdocs + dest.dir,
                },

                'this': null,                       //方便内部引用自身的实例。
                'emitter': null,                    //事件驱动器。
                'watcher': null,                    //Watcher 实例。

                'list': [],                         // item = { file, pack, isOld, key$output, output, info, };
                'file$item': {},                    //文件名对应的 list 中的 item。   

                'type$patterns': {                  //各个分包按类型合并后的路径模式。
                    'less': [],
                    'html': [],
                    'js': [],
                },

                'old': {                            //重新解析前对一些字段的备份。
                    'file$item': {},                //文件名对应的 list 中的 item。   
                    'type$patterns': {              //各个分包按类型合并后的路径模式。
                        'less': [],
                        'html': [],
                        'js': [],
                    },
                },


                //timeout 让一定时间内的多次 change 事件只会触发一次。
                change(timeout) {
                    if (timeout) {
                        clearTimeout(tid);
                        tid = setTimeout(change, timeout);
                    }
                    else {
                        change();
                    }

                    function change() { 
                        meta.emitter && meta.emitter.fire('change');
                    }
                },
            };


            Object.assign(meta, others);

            return meta;
           
        },

        reset(meta) {

            //先备份。
            Object.assign(meta.old, {
                'file$item': meta.file$item,
                'type$patterns': meta.type$patterns,
            });

            //再清空。
            Object.assign(meta, {
                'list': [],         // item = { file, pack, isOld, key$output, output, info, };
                'file$item': {},    //文件名对应的 Package 实例。   

                'type$patterns': {  //各个分包按类型合并后的路径模式。
                    'less': [],
                    'html': [],
                    'js': [],
                },
            });
        },


    };
    
});


