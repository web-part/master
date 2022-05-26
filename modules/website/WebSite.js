
/**
* 网站类。
* 事件：
*   ('parse', 'master');
*   ('render', 'master');
*   ('render', 'js-link');
*   ('compile', 'js-block');
*   ('build', 'js-block');
*   ('watch');
*   ('build');
*/
define('WebSite', function (require, module, exports) {
    const Emitter = require('@definejs/emitter');

    const Defaults = require('Defaults');
    const Log = require('Log');
    const Watcher = require('Watcher');
    const Env = require('Env');
    

    const Meta = module.require('Meta');
    const Masters = module.require('Masters');
    const Packages = module.require('Packages');
    const Resource = module.require('Resource');


    const mapper = new Map();

    class WebSite {
        /**
        * 构造器。
        *   config = {
        *       htdocs: '',     //网站的根目录。 如 `htdocs/`，相对于运行脚本所在的目录。
        *       css: '',        //网站的样式目录。 如 `style/css/`，相对于网站的根目录。
        *       packages: {         //
        *           patterns: [],   //
        *           dest: {         //
        *               dir: '',    //
        *               file: '',   //
        *           },
        *       },
        *       masters: {          //
        *           patterns: [],   //
        *           dest: '',       //如 `{name}.html`。
        *       },
        *
        *   };
        */
        constructor(config) {
            config = Defaults.get(module, config);

            let emitter = new Emitter(this);

            let meta = Meta.create(config, {
                'emitter': emitter,
                'this': this,
            });


            mapper.set(this, meta);

            //暴露出去给外面使用。
            //在 `@webpart/process-compat` 中用到。
            this.htdocs = meta.htdocs;


        }

        /**
        * 网站的根目录。
        */
        htdocs = '';

        /**
        * 解析。
        */
        parse() {
            //如果启用了分包模式，则要从母版页中减去包中所引用的资源文件。
            let meta = mapper.get(this);
            let packages = meta.PackageBlock = Packages.parse(meta);
            let excludes = packages ? packages.get('type$patterns') : {};
            

            meta.MasterBlock = Masters.parse(meta, {
                'excludes': excludes,
            });

        }


        /**
        * 编译整个站点。
        * 已重载 compile(opt);    //传入一个配置对象。
        *   opt = {
        *       packages: {             //可选，针对 packages 的配置节点。
        *           minify: false,      //是否压缩。
        *           name: '{name}',     //输出的文件名，支持 `{name}`: 当前的包名、`{md5}`: 内容的 md5 值两个模板字段。
        *           query: {            //生成到 href 中的 query 部分。
        *               md5: 4,         //md5 的长度。
        *           },
        *       },
        *       masters: {              //可选，针对 masters 的配置节点。
        *           
        *       },
        *   };
        */
        compile(opt = {}) {
            let meta = mapper.get(this);

            //设置当前的工作目录。
            meta.cwd = meta.htdocs;

            Packages.init(meta);
            this.parse();

            //此处可以共用 Packages.build()。
            Packages.build(meta, {
                'opt': opt.packages,
              
                'done'() {
                    Masters.compile(meta, {
                        'opt': opt.masters,

                        'done'() {
                            Log.allDone('全部编译完成');
                            meta.emitter.fire('compile');
                        },
                    });
                },
            });
        }

        

        /**
        * 编译整个站点，完成后开启监控。
        * 已重载 watch(opt);    //传入一个配置对象。
        *   opt = {
        *       env: 'dev',             //当前使用的环境名称。
        *       packages: {             //可选，针对 packages 的配置节点。
        *           minify: false,      //是否压缩。
        *           name: '{name}',     //输出的文件名，支持 `{name}`: 当前的包名、`{md5}`: 内容的 md5 值两个模板字段。
        *           query: {            //生成到 href 中的 query 部分。
        *               md5: 4,         //md5 的长度。
        *           },
        *       },
        *       masters: {              //可选，针对 masters 的配置节点。
        *           
        *       },
        *   };
        */
        watch(opt = {}) {
            let meta = mapper.get(this);

            //设置当前的工作目录。
            meta.cwd = meta.htdocs;

            Env.set(opt.env);
            Packages.init(meta);
            this.parse();

            Packages.watch(meta, {
                'opt': opt.packages,

                'change'() {
                    Watcher.log();
                },

                'done'() {
                    Masters.watch(meta, {
                        'opt': opt.masters,

                        'done'() {
                            Log.allDone('全部编译完成');
                            meta.emitter.fire('watch');
                            Watcher.log();
                        },
                    });
                },
            });
        }


        /**
        * 构建整个站点。
        *   opt = {
        *       env: 'prd',     //当前使用的环境名称。
        *       dir: '',        //构建整个站点的输出目录。
        *       excludes: [],   //构建前要排除在外的文件或目录，路径模式数组。
        *       cleans: [],     //构建完成后需要清理的文件或目录，路径模式数组。
        *       process: {},    //需要单独处理和转换内容的文件处理器。
        *       packages: {             //
        *           minify: true,       //是否压缩。
        *           name: '{md5}',      //输出的文件名，支持 `{name}`: 当前的包名、`{md5}`: 内容的 md5 值两个模板字段。
        *           begin: '',          //可选。 合并 js 的闭包头文件。
        *           end: '',            //可选。 合并 js 的闭包的尾文件。
        *           query: {},          //生成到 href 中的 query 部分。
        *       },   
        *       masters: {              //
        *           lessLink: {},
        *           lessBlock: {},
        *           jsBlock: {},   
        *           html: {},
        *       },
        *   };
        */
        build(opt = {}) {
            let meta = mapper.get(this);
            let cwd = meta.cwd = opt.dir;

            Env.set(opt.env);
            Resource.init(meta);
            Resource.exclude(cwd, opt.excludes);

            
            Packages.init(meta);
            Resource.process(cwd, opt.process);



            this.parse();

            Packages.build(meta, {
                'opt': opt.packages,

                'done'() {
                    Masters.build(meta, {
                        'opt': opt.masters,

                        'done'() {
                            Resource.clean(cwd, opt.cleans);
                            Log.allDone('全部构建完成');
                            meta.emitter.fire('build');
                        },
                    });
                },
            });

        }

        /**
        * 绑定事件。
        */
        on(...args) {
            let meta = mapper.get(this);
            meta.emitter.on(...args);
        }

        /**
        * 销毁。
        */
        destroy() {
            let meta = mapper.get(this);
            if (!meta) {
                return;
            }

            meta.emitter.destroy();

        }

        /**
         * 获取整个网站的相关信息。
         * 调用该方法之前，要确保先调用了 this.parse();
         * @returns 
         */
        toJSON() {
            let meta = mapper.get(this);
            let masterBlock = meta.MasterBlock.toJSON();
            let packageBlock = null;

            //要使用了 `webpart watch -p` 命令才有该对象。
            if (meta.PackageBlock) {
                packageBlock = meta.PackageBlock.toJSON();
            }

            return {
                'type': module.id,

                'id': meta.id,
                'htdocs': meta.htdocs,
                'cwd': meta.cwd,
                'css': meta.css,

                'masterBlock': masterBlock,
                'packageBlock': packageBlock,
            };
        }
    }





    return WebSite;

});




