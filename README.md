# XuexiQiangGuo

学习强国自动刷分脚本,基于Autojs<br>
支持：阅读文章（12分）、浏览视频（12分）、每日答题（5分，纯瞎蒙，容易触发人机验证，不稳定，需手动开启），加登录、评论、本地频道各一分合计每日32分。<br>
默认要求日均35分，将在每周日对比当周周一数据进行检查，如未达标则微信推送提醒手动完成答题等额外项即可。<br>
测试模式：不包含浏览时长，验证流程用<br>
熄屏调用默认完全模式<br>

## 要求

设备要求：安卓7及以上<br>
Auto.js权限：无障碍权限（分析布局并模拟点击）、存储权限（本地数据库）、悬浮窗权限（弹出式通知）、修改系统设置权限（刷视频时自动静音）、通知权限（提示脚本运行状态）、读取应用列表权限、关联启动权限（启动学习强国）（部分权限在运行时如未获取则会自动转跳到授权界面）<br>
可选权限：ROOT权限（强制关闭应用、手机自动熄屏、自动开启无障碍服务）<br>
Auto.js设置：音量上键停止脚本，如经常丢失无障碍权限则可考虑给权限保活<br>
学习强国设置：设置-通用-视频默认静音播放（脚本改音量有概率失败）、且给足权限避免运行时弹出申请而卡住<br>
Tasker设置：后台保活（移出电池优化名单，内存锁定进程、允许自启动（开机自启）、前台服务进程（此时通知栏有常驻提示，在确认保活后可关闭其通知权限））、允许读取应用列表、允许关联启动、悬浮窗权限、存储权限<br>

## 使用说明

将脚本文件夹复制到手机根目录下<br>
首次运行请先运行“个性化设置与测试.js”进行锁屏密码及微信推送等配置并进行测试<br>
推荐使用Tasker等自动化软件定时调用，新建任务-插件-autojs，然后配置要运行的脚本路径，如默认“根目录/脚本/学习强国打卡.js”。随后新建配置文件-时间，选择运行时间如2:00-2:00，随后链接到刚才新建的任务即可<br>

## 测试结果

在小米8、华为P30、一加8等机型上测试通过<br>
暂未被封,请酌情尝试<br>
