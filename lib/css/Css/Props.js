
/**
* 标签里的自定义属性。
*/
define('Css/Props', function (require, module, exports) {

    //需要忽略掉的属性。
    const ignores = ['href', 'rel', 'inline',];



    return {
        /**
        * 
        */
        stringify(props) {
            if (!props) {
                return '';
            }


            let list = [];

            Object.keys(props).forEach((key) => {
                if (ignores.includes(key)) {
                    return;
                }


                let value = props[key];
                let item = key + '="' + value + '"';

                list.push(item);
            });

            if (!list.length) {
                return '';
            }


            props = list.join(' ');
            props = ' ' + props;

            return props;

        },

    };

});


