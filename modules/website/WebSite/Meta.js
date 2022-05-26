
/**
* 
*/
define('WebSite/Meta', function (require, module, exports) {
  
    const ID = require('ID');



    return {
        /**
        * 
        */
        create(config, others) {
            let htdocs = config.htdocs;
            let id = ID.next(module.parent.id);

            let meta = {
                'id': id,                       //实例 id。
                'this': null,                   //方便内部引用自身的实例。
                'emitter': null,                //事件驱动器。

                'htdocs': htdocs,               //网站的根目录。 如 `htdocs/`
                'cwd': htdocs,                  //当前工作目录，是 htdocs 或 build。
                'css': config.css,              //网站的样式目录。 如 `style/css/`，相对于网站的根目录 htdocs。

                'masters': config.masters,      //针对 MasterBlock 的配置。
                'packages': config.packages,    //针对 PackageBlock 的配置。

                'MasterBlock': null,            //MasterBlock 实例。
                'PackageBlock': null,           //PackageBlock 实例。

            };


            Object.assign(meta, others);
           

            return meta;
           
        },


    };
    
});


