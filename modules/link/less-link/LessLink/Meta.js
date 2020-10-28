
/**
* 
*/
define('LessLink/Meta', function (require, module, exports) {
    const ID = require('ID');


    return {

        create(config, others) {
            let file = config.file;
            let id = ID.next(module.parent.id);

            let meta = {
                'id': id,                       //实例 id。
                'file': file,                   //输入的源 less 文件路径，是一个 string。

                'this': null,                   //方便内部引用自身的实例。
                'emitter': null,                //事件驱动器。
                'watcher': null,                //Watcher 实例。

                'output': {                     //编译后的输出信息。
                    'css': '',
                    'md5': '',
                    'src': file,
                    'dest': '',
                },               

                reset() {
                    meta.output = {
                        'css': '',
                        'md5': '',
                        'src': file,
                        'dest': '',
                    };
                },
            };

            Object.assign(meta, others);

            return meta;
           
        },

       

    };
    
});


