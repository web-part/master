
/**
* 
*/
define('Package/Meta', function (require, module, exports) {
    const console = require('@webpart/console');
    const File = require('@definejs/file');
    const ID = require('ID');



    return {
        /**
        * 
        */
        create(config, others) {
            let id = ID.next(module.parent.id);

            let meta = {
                'id': id,                   //实例 id。
                'file': config.file,        //包文件路径。
                'htdocs': config.htdocs,    //网站的根目录。
                'css': config.css,          //输出的样式的目录，相对于网站根目录。
                'dest': config.dest,        //js、html 文件分别打包后的输出目录。

                'name': '',                 //包的名称，由解析器获得。
                'dir': '',                  //包所在的目录，亦即包内模式路径的相对目录，由解析器获得，这里先占位说明。
                'patterns': {               //路径模式列表，由解析器获得，这里先占位说明。
                    'less': [],             
                    'js': [],
                    'html': [],
                },

                'this': null,               //方便内部引用自身的实例。
                'emitter': null,            //事件驱动器。
                'watcher': null,            //Watcher 实例。

                'LessBlock': null,          //LessBlock 实例。
                'JsBlock': null,            //JsBlock 实例。
                'HtmlBlock': null,          //HtmlBlock 实例。

                'type$output': {},          //记录编译后的输出结果。  

                //记录编译后的输出结果，与 compile(options) 中的 options 有关，
                //其中里面的每个类型(子对象) 中的 key = JSON.string(options);
                'compile': { 
                    'css': {},
                    'js': {},
                    'html': {},
                },

                'old': {
                    'name': '',                 //包的名称，由解析器获得。
                    'patterns': {               //路径模式。
                        'less': [],
                        'js': [],
                        'html': [],
                    },
                    'LessBlock': null,          //LessBlock 实例。
                    'JsBlock': null,            //JsBlock 实例。
                    'HtmlBlock': null,          //HtmlBlock 实例。

                    'type$output': {},          //记录编译后的输出结果。  
                },

                //让相应的缓存作废。
                'expire'(type) {
                    let dest = meta.type$output[type].dest;
                    if (dest) {
                        File.delete(dest);
                        console.log('删除'.bgGreen, dest.gray);
                    }

                    meta.type$output[type] = {};   //让缓存作废。
                    meta.compile[type] = {};
                },

                
            };


            Object.assign(meta, others);
           

            return meta;
           
        },

        /**
        * 
        */
        reset(meta) {
            //先备份。
            Object.assign(meta.old, {
                'name': meta.name, 
                'patterns': meta.patterns,
                'LessBlock': meta.LessBlock,
                'JsBlock': meta.JsBlock,
                'HtmlBlock': meta.HtmlBlock,
                'type$output': meta.type$output,
                'compile': meta.compile,
            });

            //再清空。
            Object.assign(meta, {
                'name': '',                 //包的名称，由解析器获得。
                'patterns': {               //路径模式。
                    'less': [],
                    'js': [],
                    'html': [],
                },

                'LessBlock': null,          //LessBlock 实例。
                'JsBlock': null,            //JsBlock 实例。
                'HtmlBlock': null,          //HtmlBlock 实例。

                'type$output': {},          //记录编译后的输出结果。  

                'compile': {                //记录编译后的输出结果，与 compile(options) 中的 options 有关。
                    'css': {},
                    'js': {},
                    'html': {},
                },
            });

        },

        

    };
    
});


