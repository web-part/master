
define('Console', function (require, module, exports) {
    const $Date = require('@definejs/date');
    const $String = require('@definejs/string');
    const File = require('@definejs/file');

    const defaults = require(`${module.id}.defaults`);

    //先备份一下原生的方法。
    const log = console.log.bind(console);
    const error = console.error.bind(console);

    const tag = String.fromCharCode(27); //console 字体彩色化导致的控制字符。
    //let tag = '\\u001b';

    let now = '';
    const RN = '\r\n';



    const meta = {
        'file': defaults.file,
        'timestamp': defaults.timestamp,
        'delay': defaults.delay,

        'contents': [], //缓存的内容，待写入到文件。
        'tid': null,

    };


    //合并多次 log 为一次写入。
    function write(content) {
        clearTimeout(meta.tid);

        meta.contents.push(content);

        meta.tid = setTimeout(() => {
            let content = meta.contents.join('');
            
            File.append(meta.file, content, null);

            meta.contents = [];

        }, meta.delay);

    }


    function done(...args) {
        let { file, timestamp, } = meta;

        if (!file) {
            return;
        }


        args = args.map((item) => {
            if (typeof item == 'string') {
                return item;
            }

            try {
                let json = JSON.stringify(item, null, 4);

                return json;
            }
            catch (ex) {
                return item;
            }
        });


        let s = args.join(' ');

        for (let i = 10; i <= 100; i++) {
            let old = tag + '[' + i + 'm';

            s = s.split(old).join('');
        }

        s = s + RN;


        if (timestamp) {
            let dt = $Date.format(new Date(), timestamp);

            if (dt != now) {
                now = dt;
                s = RN + dt + RN + s;
            }
        }


        write(s);
    }


    function init() { 
        let { file, timestamp, } = meta;

        if (timestamp === true) {
            timestamp = 'yyyy-MM-dd HH:mm:ss';
        }

        if (file) {
            File.delete(file);

            let dt = $Date.format(new Date(), 'yyyy MM dd HH mm ss');
            dt = dt.split(' ');

            file = $String.format(file, {
                'yyyy': dt[0],
                'MM': dt[1],
                'dd': dt[2],
                'HH': dt[3],
                'mm': dt[4],
                'ss': dt[5],
            });
        }

        meta.file = file;
        meta.timestamp = timestamp;
    }


    init();



    return {
        /**
        * 
        */
        log(...args) {
            log(...args);
            done(...args);
        },

        /**
        * 
        */
        error(...args) {
            args = args.map((item) => {
                if (typeof item == 'string') {
                    return item.bgRed;
                }

                try {
                    let json = JSON.stringify(item, null, 4);

                    return json.bgRed;
                }
                catch (ex) {
                    return item;
                }
            });

            error(...args);
            done(...args);
        },


    };
});



