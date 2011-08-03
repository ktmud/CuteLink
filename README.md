[CuteLink](http://cutelink.ktmud.com/) - Ajaxfy your site.
=========================================================

What is this for?
-----------------

**CuteLink** makes your site's links 'cute'. That means these links could be loaded faster and prettier, through some simple "ajaxfy" setups.

处理链接，实现异步的局部刷新加载，并保证浏览器location的链接可用.


工作过程：
---------
* 监听指定容器内所有链接的点击
* 根据配置信息里指定的模式拼接数据接口地址
* 根据当前的参数缓存，决定真实的请求地址和push到地址栏的地址
* 根据数据类型决定接受到数据后的后续处理，处理方式有：
  * a. html    - 更新目标容器的HTML
  * b. script  - 直接执行script
  * c. json    - 将json对象传给onload事件
* 如果浏览器支持pushState，将链接的地址push过去
* 如果不支持，拼接一个 url hashtag
