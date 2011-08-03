KISSY.add('cutelink/urltools', function(S, undefined) {
  var win = window,
  PAT_SEARCH = /\?(\w[^#]+)/,
  PAT_URL = /([^#\?]*)(\?([^#\?]*))?(#!?([^#]*$))?/,
  PAT_HASH = /#[^#]*$/, HASH_LEAD = '#!',
  SLASH = '/', BLANK = '',
  Q_MARK = '?', COMMA = ',',
  _UNPARAM = 'unparam', _PARAM = 'param';

  //根据当前的 location 返回参数对象
  function getLocParam() {
    return S[_UNPARAM](win.location.search.replace(Q_MARK, BLANK));
  }

  //获取location中的hash (不带#)
  function getLocHash() {
    return win.location.hash.replace(HASH_LEAD, BLANK);
  }

  //获取某特定url的hashtag (不带#)
  function getUrlHash(url) {
    if (PAT_HASH.test(url)) {
      return url.match(PAT_HASH)[0].replace(HASH_LEAD, BLANK);
    } else {
      return BLANK;
    }
  }

  //获取url中 ?... 的部分
  function getUrlSearch(url) {
    if (PAT_SEARCH.test(url)) {
      return url.match(PAT_SEARCH)[1];
    } else {
      return BLANK;
    }
  }

  //获取url中 ? 之前的部分
  //如果url的host和当前地址一样，会被替换成相对地址
  function getUrlPath(url) {
    var loc = win.location;
    return url.replace(PAT_SEARCH, BLANK).replace(PAT_HASH, BLANK)
    .replace(loc.protocol + SLASH + SLASH + loc.host, BLANK);
  }


  /**
  * 综合url中的hashtag和search部分，获取它所代表的实际参数
  *
  * 如果hash包含路径信息，
  * 则返回真实路径和真实参数
  * hashtag之前的参数会被忽略
  */
  function getUrlDetail(url) {
    //如果当前包含 #!
    var m = url.match(PAT_URL),
    host_and_path = m[1],
    search_f = m[2], //带 ?
    search = m[3] || '', //不带 ?
    hash_f = m[4], //带 # 或 #!
    hash = m[5], //不带 #!
    searchParam = S[_UNPARAM](search),
    hashParam = {},
    path = getUrlPath(url) || getUrlPath(win.location.href),
    realPath;

    var param = searchParam;

    //如果是带参数格式的hash
    if (hash_f && hash_f.indexOf(HASH_LEAD) == 0) {
      //如果HASH中含有路径信息
      if (hash.indexOf(SLASH) != -1 || hash.indexOf(Q_MARK) > 0) {
        //[重新]进行url匹配
        var m = hash.match(PAT_URL);
        //获得真实路径
        realPath = m[1];
        //真实的查询参数
        param = S[_UNPARAM](m[3]);
      } else {
        //需要的param为hash中的param
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

  //获取一个可能存在hashtag的url的真实地址
  //可以直接传入 getUrlDetail 得到的对象
  function getCleanUrl(p, forceParamObj) {
    if (S.isString(p)) {
      p = getUrlDetail(p);
    }

    var hash_f = p.hash_f,
    hash = p.hash;

    if (!forceParamObj && hash_f && hash_f.indexOf(HASH_LEAD) == 0) {
      if (hash.indexOf(SLASH) != -1 || hash.indexOf(Q_MARK) > 0) {
        //如果hash包含路径信息，直接用url hash
        return hash;
      } else {
        //否则将hash作为参数
        return p.path + Q_MARK + hash;
      }
    }

    return p.path + Q_MARK + decodeURI(S[_PARAM](p.param));
  }

  //合并删除参数
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

  //基本的Url处理函数，作为CuteLink的静态方法
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
    * 根据参数cache和目标URL，
    * 生成真正需要的地址和参数
    * 同时负责更新参数cache
    * @param {string} url 目标url.
    */
    makeRealQuery: function(url) {
      var crtLocPath = getUrlPath(win.location.href),
      path = getUrlPath(url) || crtLocPath;

      //对于没有键值对的URL，不处理
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
      //从cache里获得当前路径的真实参数
      cachedParam = pcache[toPath];


      if (cachedParam) {
        //对于当前已有的参数
        for (var i in cachedParam) {
          //如果目标参数中没有，可用直接抛弃
          if (!toParam[i]) {
            delete cachedParam[i];
          }
        }
        //对于目标URI中的参数
        for (var i in toParam) {
          //如果当前参数中没有，
          //或者当前参数中的值和目标值不一样
          //需要更新当前参数
          if (!cachedParam[i] || cachedParam[i] != toParam[i]) {
            cachedParam[i] = toParam[i];
          }

        }
      } else {
        cachedParam = pcache[toPath] = toParam;
      }

      //对参数进行排序，防止多个不同地址对应同样请求
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
