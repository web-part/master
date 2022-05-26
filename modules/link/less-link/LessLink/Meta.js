
/**
* 
*/
define('LessLink/Meta', function (require, module, exports) {
    const Url = require('Url');
    const ID = require('ID');
    const Env = require('Env');

    return {

        create(config, others) {
            let file = config.file;
            let external = Url.checkFull(file);
            let id = ID.next(module.parent.id);
            let isEnvOK = Env.check(file, external);

            let meta = {
                'id': id,               //实例 id。
                'file': file,           //输入的源 less 文件路径，是一个 string。
                'external': external,   //是否为外部地址。
                'isEnvOK': isEnvOK,     //是否匹配当前环境，如果是则编译和渲染生成 html。

                'this': null,           //方便内部引用自身的实例。
                'emitter': null,        //事件驱动器。
                'watcher': null,        //Watcher 实例。

                'output': {             //编译后的输出信息。
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


