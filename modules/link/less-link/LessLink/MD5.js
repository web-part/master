
/**
* 
*/
define('LessLink/MD5', function (require, module, exports) {


    return {

        get(meta, len) {
            if (meta.external) {
                return;
            }


            len = len || 0;
            len = len === true ? 32 : len;


            //内部文件才能生成 md5。
            let value = meta.output.md5;    //这里只需要使用编译后的 css 内容的 md5 即可。
            let key = value.slice(0, len);

            return { value, len, key, };

         
          

           
        },

    };
    
});


