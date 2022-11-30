export default log;
declare namespace log {
    function debug(x: any): void;
    function warn(x: any): void;
    function info(x: any): void;
    function error(x: any): void;
    function success(x: any): void;
    function msg(x: any): void;
}
