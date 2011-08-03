KISSY.add('cutelink/urltools', function(S, undefined) {
  var win = window,
  PAT_SEARCH = /\?(\w[^#]+)/,
  PAT_URL = /([^#\?]*)(\?([^#\?]*))?(#!?([^#]*$))?/,
  PAT_HASH = /#[^#]*$/, HASH_LEAD = '#!',
  SLASH = '/', BLANK = '',
  Q_MARK = '?', COMMA = ',',
  _UNPARAM = 'unparam', _PARAM = 'param';

  //���ݵ�ǰ�� location ���ز�������
  function getLocParam() {
    return S[_UNPARAM](win.location.search.replace(Q_MARK, BLANK));
  }

  //��ȡlocation�е�hash (����#)
  function getLocHash() {
    return win.location.hash.replace(HASH_LEAD, BLANK);
  }

  //��ȡĳ�ض�url��hashtag (����#)
  function getUrlHash(url) {
    if (PAT_HASH.test(url)) {
      return url.match(PAT_HASH)[0].replace(HASH_LEAD, BLANK);
    } else {
      return BLANK;
    }
  }

  //��ȡurl�� ?... �Ĳ���
  function getUrlSearch(url) {
    if (PAT_SEARCH.test(url)) {
      return url.match(PAT_SEARCH)[1];
    } else {
      return BLANK;
    }
  }

  //��ȡurl�� ? ֮ǰ�Ĳ���
  //���url��host�͵�ǰ��ַһ�����ᱻ�滻����Ե�ַ
  function getUrlPath(url) {
    var loc = win.location;
    return url.replace(PAT_SEARCH, BLANK).replace(PAT_HASH, BLANK)
    .replace(loc.protocol + SLASH + SLASH + loc.host, BLANK);
  }


  /**
  * �ۺ�url�е�hashtag��search���֣���ȡ���������ʵ�ʲ���
  *
  * ���hash����·����Ϣ��
  * �򷵻���ʵ·������ʵ����
  * hashtag֮ǰ�Ĳ����ᱻ����
  */
  function getUrlDetail(url) {
    //�����ǰ���� #!
    var m = url.match(PAT_URL),
    host_and_path = m[1],
    search_f = m[2], //�� ?
    search = m[3] || '', //���� ?
    hash_f = m[4], //�� # �� #!
    hash = m[5], //���� #!
    searchParam = S[_UNPARAM](search),
    hashParam = {},
    path = getUrlPath(url) || getUrlPath(win.location.href),
    realPath;

    var param = searchParam;

    //����Ǵ�������ʽ��hash
    if (hash_f && hash_f.indexOf(HASH_LEAD) == 0) {
      //���HASH�к���·����Ϣ
      if (hash.indexOf(SLASH) != -1 || hash.indexOf(Q_MARK) > 0) {
        //[����]����urlƥ��
        var m = hash.match(PAT_URL);
        //�����ʵ·��
        realPath = m[1];
        //��ʵ�Ĳ�ѯ����
        param = S[_UNPARAM](m[3]);
      } else {
        //��Ҫ��paramΪhash�е�param
        param = S[_UNPARAM](hash);
      }
    }

    return {
      path: path,
      realPath: realPath || path,
      param: param,
      search: search,
      search_f: search_f,
      searchParam: searchParam,
      hash: hash,
      hash_f: hash_f,
      hashParam: hashParam
    };
  }

  //��ȡһ�����ܴ���hashtag��url����ʵ��ַ
  //����ֱ�Ӵ��� getUrlDetail �õ��Ķ���
  function getCleanUrl(p, forceParamObj) {
    if (S.isString(p)) {
      p = getUrlDetail(p);
    }

    var hash_f = p.hash_f,
    hash = p.hash;

    if (!forceParamObj && hash_f && hash_f.indexOf(HASH_LEAD) == 0) {
      if (hash.indexOf(SLASH) != -1 || hash.indexOf(Q_MARK) > 0) {
        //���hash����·����Ϣ��ֱ����url hash
        return hash;
      } else {
        //����hash��Ϊ����
        return p.path + Q_MARK + hash;
      }
    }

    return p.path + Q_MARK + decodeURI(S[_PARAM](p.param));
  }

  //�ϲ�ɾ������
  function mergeParam(param, adds, removes) {
    if (S.isObject(adds)) {
      S.mix(param, adds);
    }
    if (S.isArray(removes)) {
      S.each(removes, function(item) {
        delete param[item];
      });
    }
    return param;
  }

  //������Url����������ΪCuteLink�ľ�̬����
  S.mix(S.CuteLink, {
    getLocParam: getLocParam,
    getLocHash: getLocHash,
    getUrlPath: getUrlPath,
    getUrlHash: getUrlHash,
    getUrlSearch: getUrlSearch,
    getUrlDetail: getUrlDetail,
    getCleanUrl: getCleanUrl,
    mergeParam: mergeParam,

    /**
    * ���ݲ���cache��Ŀ��URL��
    * ����������Ҫ�ĵ�ַ�Ͳ���
    * ͬʱ������²���cache
    * @param {string} url Ŀ��url.
    */
    makeRealQuery: function(url) {
      var crtLocPath = getUrlPath(win.location.href),
      path = getUrlPath(url) || crtLocPath;

      //����û�м�ֵ�Ե�URL��������
      if (!PAT_SEARCH.test(url)) {
        return {
          realPath: url,
          url: url,
          param: {}
        };
      }

      var pcache = this.params,
      to = getUrlDetail(url),
      toParam = to[_PARAM],
      toPath = to.realPath,
      //��cache���õ�ǰ·������ʵ����
      cachedParam = pcache[toPath];


      if (cachedParam) {
        //���ڵ�ǰ���еĲ���
        for (var i in cachedParam) {
          //���Ŀ�������û�У�����ֱ������
          if (!toParam[i]) {
            delete cachedParam[i];
          }
        }
        //����Ŀ��URI�еĲ���
        for (var i in toParam) {
          //�����ǰ������û�У�
          //���ߵ�ǰ�����е�ֵ��Ŀ��ֵ��һ��
          //��Ҫ���µ�ǰ����
          if (!cachedParam[i] || cachedParam[i] != toParam[i]) {
            cachedParam[i] = toParam[i];
          }

        }
      } else {
        cachedParam = pcache[toPath] = toParam;
      }

      //�Բ����������򣬷�ֹ�����ͬ��ַ��Ӧͬ������
      cachedParam = sortObj(cachedParam);

      var fullUrl = toPath + Q_MARK + decodeURI(S[_PARAM](cachedParam));

      return {
        realPath: toPath,
        param: cachedParam,
        url: fullUrl
      };
    }
  });

  function sortObj(o) {
    var sorted = {},
    key, a = [];

    for (key in o) {
      if (o.hasOwnProperty(key)) {
        a.push(key);
      }
    }

    a.sort();

    for (key = 0; key < a.length; key++) {
      sorted[a[key]] = o[a[key]];
    }
    return sorted;
  }
});
