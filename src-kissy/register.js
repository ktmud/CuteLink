KISSY.add('cutelink/register', function(S, undefined) {
  var win = window,
  doc = document,
  $ = S.all,
  D = S.DOM,
  _invoke = S._invoke,
  _log = S._log,

  CuteLink = S.CuteLink,

  PAT_SEARCH = /\?(\w[^#]+)/,
  PAT_URL = /([^#\?]*)(\?([^#\?]*))?(#!?([^#]*$))?/,
  PAT_HASH = /#[^#]*$/,
  SLASH = '/', BLANK = '',
  QUESTION_MARK = '?', COMMA = ',',
  ATTR_GUID = '_cl-guid',
  _STATUS = 'status',
  _CACHE = 'cache', _QUEUE = 'queue',
  _INIT = 'init', _PARSE = 'parse', _START = 'start',
  _LOAD = 'load', _LOADED = 'loaded',
  _RENDER = 'render', _RENDERED = 'rendered',
  _ERROR = 'error', _LOADING = 'loading';

  //--------- helper functions-------------//{{{
  //���ı��봦��
  function encodeURL(s) {
    var link = document.createElement('a');
    function escapeDBC(s) {
      if (!s) return BLANK;
      if (window.ActiveXObject) return s.replace(/[\d\D]/g, function($0) {
        window.vbsval = '';
        execScript('window.vbsval=Hex(Asc("' + $0 + '"))', 'vbscript');
        return '%' + window.vbsval.slice(0, 2) + '%' + window.vbsval.slice(-2);
      });
      link.href = '?key=' + s;
      return link.href.split('key=').pop();
    }
    return s.replace(/([^\x00-\xff]+)|([\x00-\xff]+)/g, function($0, $1, $2) {
      return escapeDBC($1) + encodeURIComponent($2 || '');
    });
  }

  //����URL�ж���� ? �� &
  function _url_plus(url) {
    return (_str_has(url, QUESTION_MARK) ? '&' : QUESTION_MARK);
  }

  function _str_has(str, search) {
    if (!S.isString(str)) return false;
    return str.indexOf(search) != -1;
  }

  //���ĳ��node��tagName�Ƿ�Ϊָ��tag֮һ
  function checkTagName(node, name) {
    var nodetag = node[0].tagName.toLowerCase(),
    tochecks = name.split('|'),
    ret = false;
    for (var i = tochecks.length - 1; i >= 0; i--) {
      if (nodetag == tochecks[i]) {
        ret = true;
        break;
      }
    }
    return ret;
  }

  //���˸���?
  //time begin change duration
  function easing(t, b, c, d) {
    //easeOutQuint
    return c * (Math.pow(t / d - 1, 5) + 1) + b;
    //easeOutQuart
    //return -c * (t/=d)*(t-2) + b;
  }

  function _scrollTo(target, offset) {
    var offset = offset || 0,
    target = $(target);

    if (!target.length) return;

    var startTop = D.scrollTop(),
    startLeft = D.scrollLeft(),
    destTop = target.offset().top + offset,
    gap = destTop - startTop,
    step = 20,
    duration = 400;

    if (Math.abs(startTop - destTop) < 5) return;

    function runFrame(t) {
      if (t >= duration) return;

      t += step;

      var point = easing(t, startTop, gap, duration);

      setTimeout(function() {
        win.scrollTo(startLeft, point);
      }, t);

      runFrame(t);
    }
    runFrame(0);
  }

  function execCallback(fun, data) {
    if (S.isFunction(fun)) {
      fun.call(this, data);
    } else if (S.isArray(fun)) {
      _invoke(fun, this);
    } else if (S.isObject(fun) && S.isObject(data)) {
      //��keyִ�к��� ������context��ָ��������
      for (var i in data) {
        try {
          //����context�е�dataָ���ļ�ֵ����
          fun[i].call(this, data[i]);
        } catch (e) {
          _log(e);
          _log('ִ�� ' + i + ' �ص�����', 'warn');
          _log(data);
        }
      }
    }
  }
  //}}}

  var defConf = {
    //baseCamp: undefined, //��Ҫ���¼�����������
    //nativeSubmit: undefined, //�����������Ǳ�ʱ���Ƿ�ֻ��Ĭ���ύ����
    dataType: 'json', //���������ݵ�����
    intf: '_self', //��λ�ȡ�ӿڵ�ַ
    intfAttr: 'data-cl-intf', //��ȡ�ӿڵ�ַ���Զ�������
    intfParam: BLANK, //ÿ���첽����Ҫ���ϵĲ���
    loadingCls: 'loading', //��Ŀ���������Ϻ���class
    oneLoading: false, //��������ǰ�Ƿ����ȴ���һ���������
    //�����ʾ�û�˵����������
    loadingTip: function() {
      alert('��һ��������δ��ɣ����Ժ�...');
    },
    //pushState: !(S.UA.ie < 7), //�Ƿ���Ҫ������״̬�洢����ַ��
    pushState: true, //�Ƿ���Ҫ������״̬�洢����ַ��
    doCache: true, //�Ƿ񻺴����ӷ��ص�����
    doRefresh: true, //���������ͬһ������ʱ���Ƿ�ˢ�»���
    cacheLife: 5, //�������������λΪ����
    //onload: [],  //��Ⱦ���ʱ�Ļص�
    onerror: '_fallback', //�첽�������ʱ�Ļص�
    execGlobal: true,  //�Ƿ�ִ��ȫ�ֻص�
    scrollTo: '_target', //������ɺ�ҳ�������������
    scrollOffset: 0, //��������λ�õ�ƫ��
    scrollTiming: _RENDERED //������ʱ��
  };

  /**
  * �������ʼ��CuteLinkʵ�� {{{
  *
  * Config �����
  *
  * @param {kissy selector} baseCamp ��������������ڵ�����.
  *               ������������һ��������Ĭ��Ҳ��󶨱����ύ�¼���
  *               �ύ�¼���ajax�ӿڣ�����form���Զ������Ի�config.intf�ж�.
  *
  * @param {kissy selector} target ��ȡ�������Ҫ���µ�����������.
  *
  * @param {string} loadingCls loading��ʱ��Ϊtarget�л���class.
  *
  * @param {string} dataType ���ݽ��ܺ�Ĵ���ʽ, Ĭ��ֱ�Ӹ���HTML
  *                          �������ܵ�ֵ:
  *                          * script -- �����ؽ����Ϊһ��script����.
  *                          * json   -- ���ؽ��ʱһ��json����
  *                                      ��ͨ���Զ����¼���e.data��ȡ.
  *
  * @param {string|function} intf (interface) ���ݽӿڵĻ�ȡ��ʽ.
  *            ���ܵ�ֵ:
  *            * (function) -- һ��������ͨ�����øú��������ж�.
  *            * _default  -- ���ӵ��Զ����������ȣ�����ȡ���ӵ�URL����.
  *            * _self -- ���ӵ�ַ����.
  *            * _indie -- �Զ�������ָ���ĵ�ַ.
  *            * (����) -- ��ѯ�ִ���ֱ�Ӹ��ڴ˵�ַ��.
  *
  * @param {string} intfAttr ����ӿ�����Ϊ��������ȡ�ӿڵ�HTML������.
  * @param {string} intfParam �����첽����ʱ��Ҫ���ϵĲ���,
  *                           ����push����ַ��.
  * @param {string} scollTo ���ݸ��º��Ƿ������ĳ������,
  *                         Ĭ�Ϲ�����Ŀ����������.
  * @param {number} scollOffset ������ƫ��.
  * @param {number} scollTiming ������ʱ����֧�ֵ��Զ����¼���.
  * @param {array|function|object} onload ��Ⱦ���ʱ�Ļص�.
  * @param {string|array|function|object} onerror �������ʱ�Ļص�.
  * @param {boolean} execGlobal  �Ƿ�ִ��ȫ�ֻص�, �������������json,
  *                              �����json����ļ�ִֵ��,
  *                              �������������html��
  *                              �����ע��ʵ��ʱָ����idִ��.
  *
  * ��ʾ��onerror �� onload �Ļص��¼��� this , �����Զ����¼�����.
  *
  * �Զ����¼��б�
  *
  *   # start   --  ������ӣ�����������ϣ�Ҫ��ʼ��Ⱦ������ʱ
  *   # load    --  �����첽����ʱ
  *   # loaded  --  �첽�������
  *   # error   --  �������ʱ
  *   # render  --  ��ʼ��Ⱦ
  *   # renderd --  ��Ⱦ���
  *
  *   (!)ע��: ��������˻��棬����Щ�������ֻ��ִ��render��
  *            ��������load.
  *
  */
  //}}}
  function CuteCamp(conf) {
    var self = this;
    self.init(conf);
    //������ע��ģ���һЩ������Ϣ
    return self;
  }


  var dataCache = CuteLink.data;

  S.augment(CuteCamp, S.EventTarget, {
    //���ݶ��к� guid+url ���ĳ�����Ƿ��Ѿ�����ռ
    //������к��滹������
    checkQueue: function(queueId) {//{{{
      var q = this[_QUEUE],
      crtIndex = q.indexOf(queueId),
      l = q.length;

      if (crtIndex == -1) {
        //�Ҳ�����ǰ��
        return;
      } else {
        //��ǰ���Ѿ�������ɣ�������ʶ
        q[crtIndex] = _LOADED + '||' + q[crtIndex];
      }

      //��������һλ
      if (crtIndex == l - 1) return;

      //�����ң�����пӣ�˵���Ѿ��к󷢵�����������ɣ�
      //ɾ������ӣ����ұ�return = false
      for (var i = crtIndex + 1; i < l; i++) {
        if (q[i].indexOf(_LOADED) == 0) {
          _log('[CuteLink]�� ' + (crtIndex + 1) + ' �������Ѿ����� ' + (i + 1) + ' ����ռ', 'warn');
          return true;
        }
      }
    },
    //}}}

    //��ʼ�� ���¼�
    init: function(conf) { //{{{
      var self = this,
      conf = S.merge(defConf, conf),
      dataType = conf.dataType,
      intfAttr = conf.intfAttr,
      intfParam = conf.intfParam,
      loadingCls = conf.loadingCls,
      defScrollTo = conf.scrollTo,
      scrollOffset = conf.scrollOffset,
      container = $(conf.baseCamp),
      targetContainer = $(conf.target);

      if (!container.length) return self;

      if (conf.scrollTo == '_target') {
        defScrollTo = conf.scrollTo = targetContainer;
      }

      conf = self.config = conf;
      self.isLoading = false;

      //ͨ���¼����������ӵ��
      container.on('click', userEventHandle);

      //��������ύ�¼��� ����post����ı� ������
      var theform = checkTagName(container, 'form') ? container : $('form', container[0]);
      if (theform.length && !conf.nativeSubmit && theform[0].method.toLowerCase() != 'post') {
        theform.on('submit', userEventHandle);
      }

      self.id = conf.id || S.guid();
      self.base = container;
      self.target = targetContainer;

      //���й���
      //ajax������ǰ������У����������Ӷ�����ɾ��
      self[_QUEUE] = [];

      //����scrollTiming �󶨹���ҳ���¼�
      self.on(conf.scrollTiming, function(e) {
        e.scrollTo ? _scrollTo(e.scrollTo, scrollOffset) : BLANK;
      });

      //ajax�������ʱִ��
      self.on(_ERROR, function(e) {
        var onerror = conf.onerror;
        //ָ��Ϊfallback����������ӱ���ĵ�ַ
        if (onerror === '_fallback') {
          window.location = e.url;
        } else {
          execCallback.call(self, onerror, e);
        }
      });

      self.on(_RENDER, function(e) {
        if (dataType == 'html') {
          targetContainer.html(e.data);
        }

        //������Ⱦ��ɵ��¼���
        self.fire(_RENDERED, e);
      });

      self.on(_RENDERED, function(e) {
        //�Ƿ�ִ��ȫ�ֻص�
        if (conf.execGlobal) {
          var global_callbacks = self.builder.callbacks,
          selfId = self.id;

          if (dataType == 'html' && selfId) {
            var gbc = global_callbacks[selfId];
            gbc && gbc.call(e);
          } else {
            execCallback.call(self, global_callbacks, e.data, e);
          }
        }

      });

      //�����û���������߱��ύ�¼�
      function userEventHandle(e) { //{{{
        var elem = this,
        target = e.target,
        isFormSubmit = false;

        if (checkTagName(target, 'form') && e.type == 'submit') {
          isFormSubmit = true;
        } else {
          if (!checkTagName(target, 'a')) target = target.parent('a');
          if (!target) return;
        }

        // = step.1 = ִ�г�ʼ������֮ǰ���ж�
        var parse_ret = self.fire(_PARSE, {
          target: target,
          originEvent: e
        });

        //�¼��ķ���ֵ�����䱾��˵�������� ȡ����������
        if (parse_ret && parse_ret != self) return;

        // = step.2 = �������ӣ���ȡ�ӿڵ�ַ
        var intfRet = self.parseTarget(target, e, isFormSubmit);

        //����ֵ�����ϸ�ʽ��ֹͣ��������
        if (!S.isObject(intfRet)) return;

        // = step.3 = ��ʼ������֮ǰ�ĳ�ʼ������

        //��ȫ��ID���������
        var guid = target[0].id || target.attr(ATTR_GUID);
        if (!guid) target.attr(ATTR_GUID, guid = S.guid());


        //���ݵ�ǰurl����  ��ȡ��ʵurl (��ʱҲ������ȫ��url����)
        var intfUrlInfo = urlInfo = CuteLink.makeRealQuery(intfRet.url),
        intfUrl = url = urlInfo.url;

        if (intfRet.intfUrl != intfRet.url) {
          intfUrlInfo = CuteLink.makeRealQuery(intfRet.intfUrl);
          intfUrl = intfUrlInfo.url;
        }

        //��ӽӿں�׺
        if (intfParam) intfUrl += _url_plus(intfUrl) + intfParam;
        //��guid ������ʱ���
        intfUrl += _url_plus(intfUrl) + '_cl_t=' + guid;

        var crt_req_info = guid + '::' + url;

        if (crt_req_info == self.current && conf.doRefresh) delete dataCache[url];
        self.current = crt_req_info;

        // = step.4 = �жϼ���״̬
        var evtData = {
          isFormSubmit: isFormSubmit,
          guid: guid,
          target: target,
          urlInfo: urlInfo,
          intfUrlInfo: intfUrlInfo,
          url: url,
          intfUrl: intfUrl,
          data: dataCache[url],
          scrollTo: intfRet.scrollTo || defScrollTo
        };

        //�������ȴ���һ��������ɣ���ʲô��������
        if (self.isLoading && conf.oneLoading) {
          try {
            conf.loadingTip.call(self, evtData);
          } catch (e) {}
          return e.halt();
        }

        // = step.6 = ��ʼ���������Ⱦ
        //����pushState; ��ı��ַ�����øı��ַ���¼�ȥ������
        if (conf.pushState) {
          CuteLink.history.navigate(url, self, evtData);
        } else {
          self.doRequest(evtData);
        }

        //ֹͣĬ���¼�
        e.preventDefault();
      }
      //}}}

    },
    //}}}

    //����pushUrl��������ã���ȡ�����ӿڵ�ַ
    getIntfUrl: function(url, target) {//{{{
      //���ӱ���ĵ�ַ
      var self = this,
      conf = self.config,
      //���ӵ��Զ�������ָ���Ľӿڵ�ַ������Ϊ�գ�
      intfAttr = conf.intfAttr,
      attrVal = target && target.attr(intfAttr),
      ret;

      var intf = conf.intf;

      //ȫ�ֶ����Ϊ�Զ��庯���ģ���CuteLink��ȫ�ֲ�����ȡ
      if (intf == '_global' || S.isFunction(intf)) intf = self.builder.intf;


      switch (intf) {
      case '_default':
        //2. Ĭ��ģʽ
        //���ݽӿ���ѡ�Զ���������ָ��
        //���������URL����һ��
        intfUrl = attrVal || url;
        break;

      case '_self':
        //3. ����ģʽ
        //������href����һ��
        intfUrl = url;
        break;

      case '_indie':
        //4. ����ģʽ
        //���ݽӿ����Զ���������ָ��
        intfUrl = attrVal;
        break;

      default:
        //4. ֱ��ָ���ӿڵ�·��
        //�����ӵ�search����ֱ�Ӵ����ӿڵ�ַ
        intfUrl = intf + _url_plus(intf) + CuteLink.getUrlSearch(url);
      }

      return intfUrl;
    },//}}}

    //��ȡ���Ӵ���Ĳ���
    parseTarget: function(target, e, isFormSubmit) { //{{{
      //���ӱ���ĵ�ַ
      var self = this,
      conf = self.config,
      href = target.attr('href'),

      //���ӵ��Զ�������ָ���Ľӿڵ�ַ������Ϊ�գ�
      intfAttr = conf.intfAttr,
      attrVal = target.attr(intfAttr),

      //�������(�ύ��)��Ӧ����ת����url��ַ
      url = href,

      //�ӿڵ�ַ(Ĭ��Ϊ��)
      intfUrl = BLANK,

      //������ɹ�����������
      scrollTo = BLANK,

      //��������Ľ��
      ret;

      var intf = conf.intf;

      if (isFormSubmit) {
        var formNode = target, form = formNode[0],
        elems = form.elements,
        action = form.action, formInputs = {};

        if (S.isFunction(conf.beforeSubmit)) {
          conf.beforeSubmit.call(self, form);
        }

        //ƴ�������ַ
        S.each(elems, function(item) {
          var name = item.name, value = item.value;
          if (name) formInputs[name] = encodeURL(value);
        });

        url = action;

        if (!S.isEmptyObject(formInputs)) {
          url += _url_plus(action) + S.param(formInputs);
        }
      }

      //������������ӣ����ǲ�����
      if (!url || /^(#|javascript:)/.test(url)) return;

      //����ӿڶ�����һ������
      //ִ������������ӷ���ֵ�л�ȡ�ӿڵ�ַ��Ϣ
      if (S.isFunction(intf)) {
        ret = intf.call(self, target, e);
        S.isObject(ret) ? ret.scrollTo = scrollTo : BLANK;
        return ret;
      }

      if (PAT_HASH.test(url)) {
        scrollTo = url.match(PAT_HASH)[0];
        url = url.replace(scrollTo, BLANK);
      } else {
        scrollTo = conf.scollTo;
      }

      intfUrl = self.getIntfUrl(url);

      return {
        scrollTo: scrollTo,
        intfUrl: intfUrl,
        url: url
      };
    },
    //}}}

    //�ж����ݡ������󡢽�����Ⱦ�ͻص��Ⱥ�������
    doRequest: function(evtData) { //{{{
      var self = this,
      conf = self.config,
      targetContainer = self.target,
      loadingCls = conf.loadingCls;

      if (evtData.data) {
        evtData.hasCache = true;
      }

      //�������뿪ʼ���¼���
      self.fire(_START, evtData);

      if (evtData.hasCache) {
        //����Ѿ���data���ã��۾�ֱ���ð�
        self.render(evtData);
        //����true���Ա�ʶ��ֱ����Ⱦ
        return true;
      }

      var url = evtData.url,
      intfUrl = evtData.intfUrl,
      guid = evtData.guid,
      target = evtData.target,
      queueId = guid + '||' + intfUrl;

      //�������
      self[_QUEUE].push(queueId);

      //�������뿪ʼ���¼���
      self.fire(_LOAD, evtData);

      //��Ӽ����е�class
      targetContainer.addClass(loadingCls);
      self.isLoading = true;

      //----------------����AJAX����//{{{
      S.io({
        url: intfUrl,
        success: function(ret) {
          evtData.data = ret;
          self.isLoading = false;
          targetContainer.removeClass(loadingCls);

          //_log(ret);
          if (!ret) {
            self.fire(_ERROR, evtData);
            return;
          }

          var cacheLife = self.config.cacheLife * 60000;

          //��data���뻺��
          dataCache[url] = ret;

          //�����ʱ��Ҫɾ����
          S.later(function() {
            delete dataCache[url];
          }, cacheLife);

          //��������������ݲ�δ����ռ
          if (!self.checkQueue(queueId)) self.render(evtData);

          //������ȡ������ɵ��¼���
          self.fire(_LOADED, evtData);
        },
        complete: function(ret, status) {
          self.isLoading = false;
          targetContainer.removeClass(loadingCls);
        },
        error: function(ret) {
          self.isLoading = false;
          targetContainer.removeClass(loadingCls);

          evtData.data = ret;

          //����������ɵ��¼���
          self.fire(_ERROR, evtData);

        },
        dataType: self.config.dataType
      });//}}}
    },
    //}}}

    render: function(evtData) {
      this.fire(_RENDER, evtData);
    },

    //ֱ�Ӹ���Ҫpush����ַ����url��������
    load: function(url) {
      this.doRequest({
        url: url,
        intfUrl: this.getIntfUrl(url),
        noPushState: true,
        data: CuteLink.data[url]
      });
    },

    reset: function() {
      self[_QUEUE] = [];
    }
  });

  //ע��ҳ����ĳ������Ϊcutelink��Ҫ���������
  S.augment(CuteLink, {
    register: function(config) {
      var camp = new CuteCamp(config);
      //�洢ʵ��������
      CuteLink.camps.push(this.camps[camp.id] = camp);

      //builder is some (new CuteLink())
      camp.builder = this;

      return camp;
    }
  });
});
