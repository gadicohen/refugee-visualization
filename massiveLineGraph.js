require([
  'jquery/nyt',
  'underscore/1.5',
  'foundation/views/page-manager',
  'd3/3',
  'queue/1',
  'shared/sharetools/views/sharetools'
  ], function($, _, PageManager, d3, queue, ShareTools) {

  queue()
    .defer(d3.csv, NYTG_ASSETS + "data/ces.csv")
    .defer(d3.csv, NYTG_ASSETS + "data/wages.csv")
    .await(boot);

  window._ = _;
  window.$ = $;
  window.d3 = d3;
  window.PageManager = PageManager;
  window.industries = [];
  window.industryLookup = {};
  window.nytcats = {};

  var YEARS = _.range(2004, 2015);
  var BLS_HOURS_IN_WORK_YEAR = 2080;

  var showPicks = true;
  var useForceLayout = false;

  var display = 'all';

  var prettyNumber = d3.format(',');
  var prettyPct = d3.format('+%');
  var prettyAccuratePct = d3.format('+.1%');
  var prettyMoney = d3.format("$0,f");

  var classifications = {
    'unknown': {title: 'Unclassified'},
    'unaffected': {title: 'Relatively unaffected'},
    'recovered': {title: 'Recovered'},
    'not-recovered': {title: 'Has not recovered'},
    'collapsed': {title: 'Recession accelerated decline'},
    'recovered-and-grown': {title: 'Recovered and grown'}
  };

  var mobileOrder = {70722513:0, 60541600:1, 60541500:2, 60541711:3, 65621511:0, 
    65621600:1, 65621200:2, 20236115:0, 41423300:1, 42443141:2, 55531200:3, 
    60541410:4, 32315000:0, 31336400:1, 31339100:2, 10211000:0, 10213112:1, 
    42451200:0, 32323000:1, 50511110:2, 50511120:3, 50519000:4, 80812113:0, 80812910:1};

  var labels = {
    // All.
    80812113: {all: true, klass: 'right', left: -83, top: -41},
    65624120: {all: true, klass: 'bigonly', left: 88, top: -73},
    50519000: {all: true, klass: '', left: 88, top: -27},
    65621600: {all: true, klass: 'right', top: -21, left: -59},
    60541500: {all: true, klass: '', top: -15, left: 60},
    42453300: {all: true, klass: 'right', left: -95, top: 45},
    10211000: {all: true, klass: '', left: 88, top: -13},
    42453220: {all: true, klass: 'right bigonly', left: -187, top: 32},
    42453100: {all: true, klass: 'right bigonly', left: -187, top: 2},
    55523200: {all: true, klass: '', left: -17, top: 59},
    31334200: {all: true, klass: '', left: 88, top: 60},
    50511200: {all: true, klass: '', left: -52, top: 10},
    20236117: {all: true, klass: 'bigonly', left: 88, top: 50},
    // 60541712: {all: true, klass: 'bigonly', left: -63, top: 48},
    20236115: {all: true, klass: 'right', left: -36, top: 69},
    42451200: {all: true, klass: 'right', left: -86, top: 40},
    60541990: {all: true, klass: 'bigonly', left: 88, top: -125},

    // Health.
    65621490: {left: 88, top: -19},
    65622300: {left: 88, top: -5},
    65621100: {left: 88, top: 11},
    65623300: {klass: 'right', left: -125, top: 21},
    65623210: {klass: 'right', left: -121, top: 46},
    65623100: {left: -32, top: 48},
    65621990: {left: 88, top: -20},
    65621512: {left: -10, top: 23},
    65622200: {klass: 'right', left: -36, top: -35},

    // Energy.
    20237120: {klass: 'right', left: -187, top: 66},
    43486000: {left: 88, top: 17},
    10212100: {left: -89, top: 21},
    44221200: {klass: 'right', left: -187, top: 35},
    32324000: {left: 88, top: 38},
    10213112: {klass: 'right', left: -87, top: -46},

    // Low Wage Jobs.
    80812930: {left: 88, top: 0},
    70722511: {left: 88, top: 9},
    42447000: {left: -8, top: 54},
    // 80812112: {left: 88, top: 25},
    80812112: {left: -63, top: 10},
    70722514: {left: -42, top: 55},
    60541600: {klass: 'right', left: -91, top: 6},
    60541340: {klass: 'right', left: -187, top: 31},

    // Wall St.
    55522390: {klass: 'right', left: -187, top: 20},
    55522291: {klass: 'right', left: -187, top: 34},
    55522190: {left: -45, top: -15},
    55522110: {left: -37, top: 18},
    55522120: {left: -134, top: 45},
    55522298: {left: 88, top: -9},
    55522310: {left: 7, top: 101},
    55522292: {left: 88, top: 72},
    55522210: {klass: 'right', left: -187, top: 34},
    55522220: {left: 88, top: 60},
    55522320: {left: 44, top: 45},

    // Media.
    50518000: {left: -63, top: 5},
    60541800: {left: 88, top: 24},
    60541920: {left: 27, top: 25},
    50515000: {left: -115, top: 14, klass: 'bigonly'},
    50511130: {left: -63, top: 58},
    50511120: {left: -98, top: 52},
    32323000: {klass: 'right', left: -187, top: 30},
    50511110: {left: 88, top: 53},
    42454112: {left: 3, top: 6},

    // Housing.
    55531390: {left: 88, top: -1},
    42444200: {left: -63, top: 1},
    42444100: {klass: 'right bigonly', left: -187, top: 30},
    20236118: {left: -15, top: 6, klass: 'bigonly'},
    // 55531120: {left: -63, top: 13},
    20236116: {left: 88, top: 26},
    60541310: {left: 88, top: 49},
    42442200: {klass: 'right bigonly', left: -187, top: 36},
    31321000: {left: -71, top: 63},
    // 42443141: {klass: 'right', left: -160, top: 14},
    20237200: {left: 88, top: 57},

    // Manufacturing.
    31333100: {left: 88, top: -8},
    32311000: {klass: 'right', left: -187, top: 35},
    31333600: {left: 69, top: -3},
    32326000: {klass: 'right', left: -187, top: 31},
    31337000: {klass: 'right', left: -50, top: 0},
    32314000: {klass: 'right bigonly', left: -187, top: 36},
    32315000: {left: -110, top: 47},
    31333300: {top: 77},
    31334100: {left: 88, top: 52},
    31336400: {left: 88, top: 18},

    // Grooming, Booming.
    80812910: {left: 88, top: -57},
    42446120: {left: 88, top: -2},
    42446190: {left: 88, top: 12},
    42446110: {left: 88, top: 28}
  };

  var win = $(window);
  var body = $('body');
  var container = $('.whole-graphic');
  var graphic = $('#g-graphic');
  var graphicLayer = $('.graphic-layer');
  var graphicAndLayer = $('#g-graphic, .graphic-layer');
  var graphicWrapper = $('.graphic-wrapper');
  var sections = $('.graphic-section');
  var theTable = $('#g-table');
  var timeText = $('.timetext');
  var theScroll = $('.the-scroll');
  var theKey = $('.the-key');

  var datefmt = d3.time.format('%B %Y');

  var shortMonths = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", 
    "Sep", "Oct", "Nov", "Dec"];

  var prettyMonth = function(time) {
    var month = shortMonths[time.getUTCMonth()];
    return month + (month == 'May' ? '' : '.');
  };

  var altsectors = _.pluck(ALTEGORIES, 'nutitle');
  CATEGORIES = _.filter(CATEGORIES, function(c){ return !! c.nytcategory; });
  var catsectors = _.pluck(CATEGORIES, 'nytcategory');
  var adjInflation = _.reduce(INFLATION, function(memo, row) {
    var pair = row.month.split('\n');
    var year = pair[1];
    var month = (_.indexOf(shortMonths, pair[0]) + 1);
    if (month < 10) month = '0' + month;
    var date = year + '-' + month + '-01';
    memo[date] = parseFloat(row.multiplier, 10);
    return memo;
  }, {});
  var noSector = 'all';
  altsectors.unshift(noSector);
  catsectors.unshift(noSector);
  var currentSector = noSector;

  var spaceWidth, spaceHeight, spaceX, spaceY, bubbleScale, bigBubbleScale,
    strokeWidthScale, opacityScale, margin, render, lastWageMonth, missingWages, 
    graphicPos, graphicWrapperPos, chartStop, firstSectionTop, lastSectionTop;

  window.tablePos = null;

  var chartPegged = false;
  var keyShown = false;
  var totalHeightFudge = 50;

  var xDomain = [8.5, 51];
  var yDomain = [-0.57, 0.68];

  var isMobile;

  toggleMobile();
  toggleNoWarning();

  var chartWidth = isMobile ? 230 : 185;
  var chartHeight = 220;

  // Get the party started.
  function boot(err, cesData, wageData) {
    if (cesData) window.originalCesData = cesData;
    if (wageData) window.originalWageData = wageData;
    processCesData();
    renderTable();
    renderGraphic();
    // renderKey();
    renderSparkline();
    bindEvents();
    startFixie();
    transitionBetween(true);
    toggleKey();
    cloneToStaticSpots();
    // waitForWebFonts();
    // togglePlacement();
  }

  function waitForWebFonts() {
    if (body.hasClass('wf-loading')) {
      var check = function() {
        if (!body.hasClass('wf-loading')) {
          clearInterval(interval);
          render();
        }
      }
      var interval = setInterval(check, 100);
    }
  }

  function renderSparkline() {
    var el = $('.sparkline');
    var w = el.width();
    var h = el.height();

    var svg = d3.select(el[0]).append('svg')
      .attr('width', w)
      .attr('height', h);

    var industry = cesData[4];

    el.addClass(industry.classification);
    var emp1 = industry.empFirst;
    var x = d3.time.scale()
      .rangeRound([0, w])
      .domain(d3.extent(industry.data, function(d){ return d.date; }));
    var y = d3.scale.linear()
          .rangeRound([h - 2, 2])
          .domain(d3.extent(industry.data, function(d){ return d.employment; }));

    var lineArea = d3.svg.area()
        .x(function(d){ return x(d.date); })
        .y(function(d){ return y(d.employment); })
        .interpolate('basis');

    var line = svg.append("path")
      .datum(industry.data)
      .attr("class", "emp-line is-active")
      // .style('stroke-width', strokeWidthScale(industry.empLast))
      .style('stroke-width', 2)
      // .style('opacity', opacityScale(industry.empLast))
      .style('fill', 'none')
      .attr("d", lineArea);

  }

  function renderKey() {
    var dim = 40;
    $('.arrow-key').each(function() {
      var down = $(this).hasClass('down');
      var right = !down;
      var g = d3.select(this).append('svg')
        .attr('width', dim)
        .attr('height', dim)
      .append('g');

      g.append("svg:defs").selectAll("marker")
         .data(["arrow"])
       .enter().append("svg:marker")
         .attr("id", String)
         .attr("viewBox", "0 -5 10 10")
         .attr("refX", 0)
         .attr("refY", 0)
         .attr("markerWidth", 10)
         .attr("markerHeight", 10)
         .attr("orient", "auto")
         .append("svg:path")
         .attr("d", "M 0,-4 L 10,0 L 0,4 ");

      g.append("svg:line")
         .attr("x1", down ? dim / 2 : 0)
         .attr("y1", down ? 0 : dim / 2)
         .attr("x2", down ? dim / 2 : dim - 10)
         .attr("y2", down ? dim - 10 : dim / 2)
         .attr("class", "key-arrow")
        .attr("marker-end", "url(#arrow)");
    });
  }

  var lowWageBreak, highWageBreak;
  function wageClassify(industry) {
    var c;
    var finalWage = industry.finalWage;
    if (finalWage <= lowWageBreak) {
      c = 'low-wage';
    } else if (finalWage <= highWageBreak) {
      c = 'mid-wage';
    } else {
      c = 'high-wage';
    }
    industry.wageClassification = c;
  }

  function findWageBreaks(ces) {
    lowWageBreak = 17;
    highWageBreak = 35;

    // var sorted = _.sortBy(ces, 'finalWage');
    // var totalEmp = _.reduce(sorted, function(memo, row) {
    //   return memo + row.empLast;
    // }, 0);
    // var third = totalEmp / 3;
    // var soFar = 0;
    // _.each(sorted, function(row) {
    //   soFar += row.empLast;
    //   if (!lowWageBreak && soFar >= third) {
    //     lowWageBreak = row.finalWage;
    //   } else if (!highWageBreak && soFar >= (third * 2)) {
    //     highWageBreak = row.finalWage;
    //   }
    // });
    // console.log('wage breaks:', lowWageBreak, highWageBreak);
  }

  function classify(industry, data) {
    data || (data = industry.data);
    var factor = 0.06;
    var emps = _.pluck(data, 'employment');
    var index2008 = _.indexOf(YEARS, 2008) * 12;
    var index2010 = _.indexOf(YEARS, 2010) * 12;
    var recessionEmps = emps.slice(index2008, index2010);
    var preRecessionPeakEmp = _.max(emps.slice(0, _.indexOf(YEARS, 2008) * 12));
    // var yoys = [null];
    var prevEmp;
    var classification = 'unclassified';
    var yoyIndex07 = _.indexOf(YEARS, 2007) + 1;
    var yoyIndex08 = _.indexOf(YEARS, 2008) + 1;
    var yoyIndex09 = _.indexOf(YEARS, 2009) + 1;
    var gainsCount = 0;
    var lossesCount = 0;
    for (var i = 0; i < YEARS.length; i++) {
      var janEmp = emps[i * 12];
      if (prevEmp) {
        var yoy = (janEmp - prevEmp) / prevEmp;
        if (yoy > factor / 2) gainsCount++;
        if (yoy < -factor / 2) lossesCount++;
        // yoys.push(yoy);
      }
      prevEmp = janEmp;
    }
    var gainedThroughRecession = true;
    var prevMax = recessionEmps[0];
    for (var i = 1; i < recessionEmps.length; i++) {
      var cur = recessionEmps[i];
      if (cur + (cur * (factor / 5)) < prevMax) { 
        gainedThroughRecession = false;
        break;
      }
      if (cur > prevMax) prevMax = cur;
    }
    if (gainsCount + lossesCount < 1 || lossesCount == 0 && gainedThroughRecession) {
      classification = 'unaffected';
    } else if (industry.empLast > preRecessionPeakEmp + (factor * preRecessionPeakEmp)) {
      classification = 'recovered-and-grown';
    // } else if (yoys[yoyIndex07] < -factor || yoys[yoyIndex08] < -factor || yoys[yoyIndex09] < -factor) {
    } else {
      if (industry.empLast > preRecessionPeakEmp - (factor * preRecessionPeakEmp)) {
        classification = 'recovered';
      } else if (industry.chgSinceQ4Oh7 < factor) {
        if (industry.empFirst > industry.empdec07 + ((factor / 3) * industry.empdec07) && industry.empLast < industry.empdec09 - (industry.empdec09 * (factor / 2))) {
          classification = 'collapsed';
        } else {
          classification = 'not-recovered';
        }
      }
    }
    industry.classification = classification;
  };

  function scrollToSection(section) {
    var top = section.cachedPos.top;
    $('body, html').animate({scrollTop: top - 70});
  }

  function scrollToTable() {
    var top = tablePos.top;
    $('body, html').animate({scrollTop: top - 70});
  }

  function toggleNoWarning() {
    var noWarn = (/nowarning/i).test(window.location.search);
    container.toggleClass('nowarning', noWarn);

    new ShareTools({ 
      el: $(".warnit .g-sharetools"),
      url: "http://www.nytimes.com/interactive/2014/06/05/upshot/how-the-recession-reshaped-the-economy-in-255-charts.html",
      title: "How the Recession Reshaped the Economy, in 255 Charts",
    });
  }

  function toggleMobile() {
    var isAndroid = (/Android/i).test(navigator.userAgent);
    var isIOS = (/(iPod|iPhone|iPad)/i).test(navigator.userAgent);
    var width = win.width();
    isMobile = !!((width <= 400) || (isAndroid && (width <= 1024)) || (isIOS && (width <= 1024)));
    container.toggleClass('is-mobile', isMobile);
  }

  function bindEvents() {
    $(function() {
      win.scrollTop(0);
    });

    PageManager.on('nyt:page-breakpoint', toggleMobile);

    theScroll.on('click', 'img', function() {
      scrollToSection(sections[0]);
    });

    container.on('click', '.next-link', function() {
      var next = $(this).attr('data-section');
      if (next == 'table') {
        scrollToTable();
      } else {
        var section = _.findWhere(sections, {category: next});
        scrollToSection(section);
      }
    });

    graphic.on('click', '.marker', function() {
      var section = _.findWhere(sections, {category: $(this).attr('data-section')});
      scrollToSection(section);
    });

    body.on('mousemove', '.is-open .a-chart, .show-table .a-chart', drawBead);

    body.on('mouseout', '.is-open .a-chart, .show-table .a-chart', hideBead);

    container.on('mouseover touchstart', '.i-link', function() {
      if (isMobile) return;
      closeTile();
      var industry = indexedCes[$(this).attr('data-ces')];
      showTile(industry);
    });

    graphic.on('mouseover touchstart', '.emp-line.is-active', function() {
      if (inTransition) return;
      if (display == 'all') {
        closeTile();
        var industry = indexedCes[$(this).closest('.g-industry').attr('data-ces')];
        showTile(industry);
      }
    });
  };

  function showJobs(industry, datapoint, wagepoint, el) {
    el || (el = d3.select(industry.clone || industry.element));
    var jobsEl = el.select('.info-jobs');
    var wagesEl = el.select('.info-wages');

    var current = datapoint === industry.data[industry.data.length - 1];
    if (current) {
      jobsEl.html('Current Jobs: ' + prettyNumber(Math.round(datapoint.employment)));
    } else {
      jobsEl.html('<span class="info-datebit">' + prettyMonth(datapoint.date) + "</span> " + datapoint.date.getUTCFullYear() + " Jobs: " + prettyNumber(Math.round(datapoint.employment)));
    }
    wagesEl.html("Average Salary: " + (wagepoint ? prettyMoney(wagepoint.wage * BLS_HOURS_IN_WORK_YEAR) : '—'));
  }

  function drawBead(e) {
    e.preventDefault();
    if (isMobile) return;
    var industry = this.industry;
    var offset = $(this).offset();
    var x = e.pageX - offset.left;
    var y = e.pageY - offset.top;
    var xDate = chartX.invert(x - cMargin.left);
    var datapoint, wagepoint;
    for (var i = 0; i < industry.data.length; i++) {
      if (industry.data[i].date >= xDate) {
        datapoint = industry.data[i];
        wagepoint = industry.wages[i - missingWages];
        break;
      }
    }
    if (!datapoint) {
      datapoint = industry.data[industry.data.length - 1];
      wagepoint = industry.wages[industry.wages.length - 1];
    }
    var empSecond = industry.data[1].employment;
    var neg = datapoint.employment < industry.empFirst || (datapoint.employment == industry.empFirst && empSecond < industry.empFirst);
    var x = chartX(datapoint.date);
    var y = industry.chartY(datapoint.employment);
    var el = d3.select(industry.clone || industry.element);
    var bead = el.select('.a-bead');
    // bead.attr('cx', x).attr('cy', y);
    bead.attr("transform", "translate(-2.5, 0) translate(" + (x + (neg ? 4 : 0)) + "," + (y + (neg ? 7 : -7)) + ") rotate(" + (neg ? 180 : 0) + ")");
    showJobs(industry, datapoint, wagepoint, el);
  }

  function hideBead(e) {
    if (isMobile) return;
    var industry = this.industry;
    var el = d3.select(industry.clone || industry.element);
    showJobs(industry, industry.data[industry.data.length - 1], industry.wages[industry.wages.length - 1], el);
  }

  var openTile = null;
  function closeTile() {
    if (isMobile) return;
    win.off('mouseover', closeTile);
    if (openTile) {
      openTile.original.removeClass('no-label');
      openTile.removeClass('is-open');
      openTile.industry.clone = null;
      var openTileRef = openTile;
      _.delay(function() {
        openTileRef.remove();
      }, 500);
    }
    openTile = null;
  }

  function showTile(industry) {
    if (isMobile) return;
    var el = $(industry.element);
    var clone = el.clone();
    clone.industry = industry;
    industry.clone = clone[0];
    clone.original = el;
    el.addClass('no-label');
    graphicLayer.append(clone);
    clone.find('.a-chart')[0].industry = industry;
    _.defer(function() {
      clone.addClass('is-open');
    });
    openTile = clone;
    clone.on('mouseover', function() { return false; });
    _.defer(function() {
      win.on('mouseover', closeTile);
    });
  }

  function cloneToStaticSpots() {
    var mobileCes = _.sortBy(_.filter(cesData, function(industry) {
      return !!industry.mobilecategory;
    }), function(industry) {
      return mobileOrder[industry.cescode];
    });
    for (var i = 0; i < mobileCes.length; i++) {
      var industry = mobileCes[i];
      var cat = industry.mobilecategory;
      var order = mobileOrder[industry.cescode];
      var clone = $(industry.element).clone();
      $('.static-spot.' + cat).append(clone);
    }    
  }

  function calcOpacity(elTop, idealOpaque, fromTop) {
    return Math.max(0, 1 - (Math.max(0, Math.abs(idealOpaque - elTop) - fromTop) * 0.007));
  }

  var floating = false, atOrigin = true, prevY = 0;
  function startFixie() {
    win.on('scroll resize touchmove', function() {
      var y = win.scrollTop();
      var fromTop = (spaceHeight / 8);
      var idealOpaque = y + fromTop;

      // Graphic.
      if (!floating && y + totalHeightFudge >= graphicWrapperPos.top) {
        graphicAndLayer.addClass('fixed');
        floating = true;
      } else if (floating && y + totalHeightFudge < graphicWrapperPos.top) {
        graphicAndLayer.removeClass('fixed');
        floating = false;
      }

      // Sections.
      var anySection = false;
      for (var i = 0; i < sections.length; i++) {
        var sec = sections[i];
        var opacity = 0;
        if (y > 0) {
          opacity = calcOpacity(sec.cachedPos.top, idealOpaque, fromTop);
        }
        if (sec.currentOpacity != opacity) {
          sec.white.toggleClass('opaque', opacity > 0);
          sec.white.css({opacity: opacity});
          sec.currentOpacity = opacity;
        }
        if (!anySection && opacity > 0) {
          anySection = true;
          var cat = sec.category;
          if (currentSector != cat) {
            currentSector = cat;
            setSector();
          }
        }
      }
      if (!anySection && (currentSector != noSector) && (y < firstSectionTop || y > lastSectionTop)) {
        currentSector = noSector;
        setSector();
      }

      var shouldAtOrigin = (y < 50);
      if (shouldAtOrigin != atOrigin) {
        atOrigin = shouldAtOrigin;
        togglePlacement();
      }

      // Chart.
      var pastPeg = y >= chartStop;
      if (pastPeg && !chartPegged) {
        graphicAndLayer.addClass('tabled').css({top: chartStop + 50});
        graphicPos = graphic.offset();
        chartPegged = true;
      } else if (!pastPeg && chartPegged) {
        graphicAndLayer.removeClass('tabled').css({top: 'auto'});
        graphicPos = graphic.offset();
        chartPegged = false;
      }

      // Table
      var switchFactor = prevY < y ? 1.15 : 5;
      var nextDisplay = (y + (spaceHeight / switchFactor) >= tablePos.top) ? 'table' : 'all';
      if (!inTransition && (nextDisplay != display)) {
        display = nextDisplay;
        transitionBetween();
      }

      prevY = y;
    });

    win.on('resize', _.debounce(function() {
      render();
    }, 50));
  }

  function avg(list, property) {
    var sum = 0;
    for (var i = 0; i < list.length; i++) {
      sum += list[i][property];
    }
    return sum / list.length;
  };

  function sluggify(s) {
    return s.toLowerCase().replace(/\W/g, '-');
  };

  function renderTable() {
    var indexed = _.groupBy(cesData, 'nytcategory');

    _.each(CATEGORIES, function(row) {
      var cat = row.nytcategory;
      row.slug = sluggify(cat);
      var industries = _.sortBy(indexed[cat], 'empLast').reverse();
      var catEl = $('<div class="nytcategory ' + row.slug + '"><h2>' + cat + '</h2></div>');
      if (row.blurb) {
        var blurb = $('<div class="sector-blurb"><p>' + row.blurb + '</p></div>');
        if (false && row.hiddennotes) {
          blurb.append('<p>' + row.hiddennotes + '</p>');
        }
        catEl.append(blurb);
      }
      var catContent = $('<div class="category-content"></div>').appendTo(catEl);
      _.each(industries, function(industry) {
        var indEl = $('<div class="g-industry-spot ces-' + industry.cescode + '"></div>');
        indEl.appendTo(catContent);
      });
      catContent.append($('<div class="g-clear"></div>'));
      catEl.appendTo(theTable);
    });
  }

  function transitionSector(direction) {
    var index = _.indexOf(sectors, currentSector);
    if (direction == 'next') {
      currentSector = sectors[index + 1] || sectors[0];
    } else {
      currentSector = sectors[index - 1] || sectors[sectors.length - 1];
    }
    setSector();
  }

  function setSector() {
    var top = 0;
    // $('.current-sector').text(currentSector);
    var realSector = currentSector != noSector;
    closeTile();
    if (display == 'all') {
      top = graphic.offset().top;
      setMarkerDots();
      for (var i = 0; i < cesData.length; i++) {
        var industry = cesData[i];
        var active = !realSector;
        if (!active) {
          for (var j = 0; j < industry.alternacategory.length; j++) {
            if (industry.alternacategory[j] == currentSector) {
              active = true;
            }
          }
        }
        var klass = active ? 'is-active' : 'not-active';
        var labelIsActive = industry.label && (!!((realSector && active) || (!realSector && industry.label.all)));
        if (labelIsActive !== industry.labelIsActive) industry.label.el.toggleClass('is-active', labelIsActive);
        if (industry.line && (industry.lineIsActive !== active)) industry.line.attr('class', 'emp-line emp-realline ' + klass);
        industry.labelIsActive = labelIsActive;
        industry.lineIsActive = active;
        toggleKey();
      }
    }
  }

  function toggleKey() {
    if (!keyShown && !atOrigin && prevY < 2000 && currentSector == sectors[0]) {
      theKey.css({opacity: 1});
      keyShown = true;
    } else if (keyShown && (atOrigin || currentSector != sectors[0])) {
      theKey.css({opacity: 0});
      keyShown = false;
    }
  }

  function setMarkerDots() {
    markerDots.attr('class', function(d) {
      return (d.attributes['data-cat'].value == currentSector) ? 'active marker' : 'marker';
    });
  }

  function renderGraphic() {
    // CES
    $('.g-industries').remove();
    var list = $('<div class="g-industries"></div>');
    graphic.append(list);
    renderIndustry(list, cesData, true);
    renderCharts(cesData);
  }

  function renderIndustry(list, data) {
    _.each(data, function(industry) {
      var name = (industry.nytlabel || industry.industry);
      var item = $('<div class="g-industry" data-ces="' + industry.cescode + '"><div class="industry-header"><span class="industry-title">' + name + '</span><div class="industry-info"></div></div><div class="svgwrap"><svg class="a-chart"></svg></div></div>');
      industry.element = item[0];
      item.find('.a-chart')[0].industry = industry;
      var label = labels[industry.cescode];
      if (label) {
        label.el = $('<div class="industry-label ' + (label.klass || '') + '" style="margin-left: ' + (label.left || 0) + 'px; margin-top: ' + (label.top || 0) + 'px;">' + name + '</div>');
        item.append(label.el);
      }
      industry.label = label;
      list.append(item);
      if (industry.sub && industry.sub.length) {
        var childList = $('<ul></ul>');
        item.append(childList);
        renderIndustry(childList, industry.sub);
      }
    });
  }

  function renderCharts(industries) {

    var empExtent = d3.extent(industries, function(d){ return d.empLast; });
    var wageExtent = d3.extent(industries, function(d){ return d.finalWage; });

    margin = {
      top: 140, left: 50, bottom: 50, right: 0
    };

    // bubbleScale = d3.scale.sqrt()
    //   .domain(empExtent)
    //   .rangeRound([2, 26]);

    // bigBubbleScale = d3.scale.sqrt()
    //   .domain([0, empExtent[1]])
    //   .rangeRound([0, 42]);

    strokeWidthScale = d3.scale.sqrt()
      .domain([0, empExtent[1]])
      .range([1, 5]);

    opacityScale = d3.scale.linear()
      .domain([0, empExtent[1]])
      .range([0.1, 1]);

    render = window.render = function() {
      container.addClass('notransition');
      var everythingHeight = win.height() - totalHeightFudge;
      graphicAndLayer.css({height: everythingHeight, width: win.width()});
      sections.css({height: everythingHeight * 0.55});
      spaceWidth = graphic.width();
      spaceHeight = graphic.height();

      graphicWrapperPos = graphicWrapper.offset();
      graphicPos = graphic.offset();

      _.each(sections, function(section) {
        var el = $(section);
        section.white = el.find('.graphic-sectionwhite');
        section.cachedPos = section.white.offset();
        section.category = el.attr('data-cat');
      });
      firstSectionTop = sections[0].cachedPos.top;
      lastSectionTop = sections[sections.length - 1].cachedPos.top;

      chartStop = lastSectionTop + 150;
      theTable.css({'margin-top': 150 + spaceHeight * 0.7});
      theScroll.css({opacity: 1, top: spaceHeight * 0.85});
      if (chartPegged)  graphicAndLayer.css({top: chartStop + 50});

      spaceX = d3.scale.linear()
        // .domain(empExtent)
        .domain(xDomain)
        .rangeRound([margin.left * 1.3, spaceWidth - (margin.left * 1.3) - (margin.right)]);

      spaceY = d3.scale.linear()
        // .domain(d3.extent(industries, function(d){ return d.chgSinceQ4Oh7; }))
        .domain(yDomain)
        .rangeRound([spaceHeight - margin.bottom, margin.top]);

      for (var i = 0; i < industries.length; i++) {
        renderChart(industries[i]);
      }

      renderLegend();
      togglePlacement();
      setMarkerDots();

      _.delay(function() {
        container.removeClass('notransition');
        graphicWrapperPos = graphicWrapper.offset();
      }, 200);
    };
    render();

    var forceTick = function(e) {
      var k = 0.5 * e.alpha;

      var gravity = function(d) {
        d.x += (d.spaceX - d.x) * k;
        d.y += (d.spaceY - d.y) * k;
      };

      for (var i = 0; i < industries.length; i++) {
        var industry = industries[i];
        gravity(industry, i);
        // collide(industry, i);
        // industry.x = Math.min(spaceWidth - chartWidth, Math.max(industry.x, -40));
        // industry.y = Math.min(spaceHeight - chartHeight, Math.max(industry.y, 0));
        industry.finalX = industry.x;
        industry.finalY = industry.y;
        move(industry);
      }
    };

    // var q = d3.geom.quadtree()
    //   .x(function(d){ return d.x + d.bbox.x1; })
    //   .y(function(d){ return d.y + d.bbox.y1; })
    //   (industries);

    // var collide = function(industry, i) {
    //   var k = 0.8;
    //   var b = industry.bbox;
    //   var nx1 = industry.x + b.x1,
    //       nx2 = industry.x + b.x2,
    //       ny1 = industry.y + b.y1,
    //       ny2 = industry.y + b.y2;
    //   // q.visit(function(quad, x1, y1, x2, y2){
    //   _.each(industries, function(other){
    //     // var other = quad.point;
    //     if (other && (other !== industry)) {

    //       var dx = nx1 - (other.x + other.bbox.x1),
    //         dy = ny1 - (other.y + other.bbox.y1),
    //         absx = Math.abs(dx),
    //         absy = Math.abs(dy),
    //         w = (b.width + other.bbox.width) / 2,
    //         h = (b.height + other.bbox.height) / 2;
    //       if (absx < w && absy < h) {
    //         absx = (absx - w) * (dx < 0 ? -k : k);
    //         industry.x -= absx;
    //         other.x += absx;
    //         absy = (absy - h) * (dy < 0 ? -k : k);
    //         industry.y -= absy;
    //         other.y += absy;
    //       }

    //     }
    //     return x1 > nx2 || x2 < nx1 || y1 > ny2 || y2 < ny1;
    //   });
    // };

    if (useForceLayout) {
      var force = d3.layout.force()
        .nodes(industries)
        .gravity(0)
        .chargeDistance(500)
        .charge(-50)
        .friction(0.99)
        .size([spaceWidth, spaceHeight])
        .on('tick', forceTick)
        .start();

      container.addClass('notransition');
      _(7).times(force.tick);
      force.stop();
      _.defer(function() {
        container.removeClass('notransition');
      });
    }
  }

  var MARGIN_UP = 102;

  var cMargin = {top: 10 + MARGIN_UP, right: 5, bottom: 16, left: 35},
    cWidth = chartWidth - cMargin.left - cMargin.right,
    cHeight = chartHeight - cMargin.top - cMargin.bottom;

  var chartX;

  function renderChart(industry) {

    if (industry.rendered) return;

    industry.rendered = true;
    var data = industry.data;
    var el = $(industry.element);

    if (!data.length) {
      el.find('svg').replaceWith('<div class="apology">Only rendering the private sector at the moment</div>');
      return;
    }

    var classification = classifications[industry.classification];

    var emp1 = industry.empFirst;
    var empLast = industry.empLast;
    var q4change = industry.chgSinceQ4Oh7;
    // var bs = bubbleScale(empLast);

    el.addClass(industry.classification);
    el.addClass(industry.wageClassification);

    var info = el.find('.industry-info');
    // info.append('<span>Change since Q4 \'07: ' + prettyPct(q4change) + '</span>');
    if (classification) {
      info.append('<div class="info-span classification ' + industry.classification + '">' + classification.title + '</div>');
    }
    info.append('<div class="info-span info-jobs">Current Jobs: ' + prettyNumber(Math.round(empLast)) + '</div>');
    info.append('<div class="info-span info-wages">Average Salary: ' + prettyMoney(industry.finalSalary) + '</div>');
    // info.append('<span>' + industry.cescode + '</span>');

    var yExtent = d3.extent(data, function(d){ return d.employment; });
    var goesABitNeg = (yExtent[0] - emp1) < (-0.2 * emp1);
    var goesALotNeg = (yExtent[0] - emp1) < (-0.4 * emp1);
    var goesABitPos = (yExtent[1] - emp1) > (0.2 * emp1);
    var goesALotPos = (yExtent[1] - emp1) > (0.4 * emp1);
    if (goesALotNeg && !goesABitPos) {
      var yDomain = [emp1 - (emp1 * 0.7), emp1 + (emp1 * 0.1)];
    } else if (goesALotPos && !goesABitNeg) {
      var yDomain = [emp1 - (emp1 * 0.1), emp1 + (emp1 * 0.7)];
    } else {
      var yDomain = [emp1 - (emp1 * 0.4), emp1 + (emp1 * 0.4)];
    }
    var chartY = d3.scale.linear()
        .rangeRound([cHeight, 0])
        .domain(yDomain);
    industry.chartY = chartY;

    var xAxis = d3.svg.axis()
        .scale(chartX)
        .tickValues(_.map(['2004-01-01', '2009-01-01', '2013-01-01'], function(d) {
          return new Date(Date.parse(d));
        }))
        .tickFormat(function(d){ return d.getUTCFullYear(); })
        .orient("bottom");

    var yAxis = d3.svg.axis()
        .scale(chartY)
        .tickValues([yDomain[0], emp1, yDomain[1]])
        .tickSize(0)
        .tickFormat(function(d, i) {
          return prettyPct((d - emp1) / emp1);
        })
        .orient("left");

    var lineArea = d3.svg.area()
        .x(function(d){ return chartX(d.date); })
        .y(function(d){ return chartY(d.employment); })
        .interpolate('basis');

    var area = d3.svg.area()
        .x(function(d){ return chartX(d.date); })
        .y0(chartY(emp1))
        .y1(function(d){ return chartY(d.employment); });

    var theChartWidth = cWidth + cMargin.left + cMargin.right;
    var theChartHeight = cHeight + cMargin.top + cMargin.bottom;

    $(industry.element).find('.svgwrap').css({
      width: theChartWidth,
      height: theChartHeight - MARGIN_UP
    });

    var svg = d3.select(industry.element).select('svg')
        .attr('width', theChartWidth)
        .attr('height', theChartHeight)
        .style('top', 0);

    var g = svg.append('g')
        .attr("transform", "translate(" + cMargin.left + "," + cMargin.top + ")");

    g.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + cHeight + ")")
      .call(xAxis);

    g.append("g")
      .attr("class", "y axis")
      .call(yAxis);

    var line = g.append("path")
      .datum(data)
      .attr("class", "emp-line emp-realline")
      // .style('stroke-width', strokeWidthScale(industry.empLast))
      .style('stroke-width', 2)
      // .style('opacity', opacityScale(industry.empLast))
      .style('fill', 'none')
      .attr("d", lineArea);
    industry.line = line;

    // var bubble = g.append("circle")
    //   .attr("class", "emp-line emp-bubble")
    //   .attr('cx', (chartWidth - cMargin.left - cMargin.right) / 2)
    //   .attr('cy', (chartHeight - cMargin.top - cMargin.bottom) / 2)
    //   .attr("r", bigBubbleScale(empLast));
    // industry.bubble = bubble;

    g.append("path")
      .datum(data)
      .attr("class", "emp-area")
      .attr("d", area);

    // var bead = g.append('circle')
    //     .attr('class', 'a-bead')
    //     .attr('cx', -1000)
    //     .attr('cy', -1000)
    //     .attr('r', 2.5);

    var bead = g.append('g')
        .attr("transform", "translate(-1000,-1000)")
        .attr('class', 'a-bead');
    bead.append('path')
        .attr('d', 'M 0 0 L 2.5 4 L 5 0 Z');

    g.append('rect')
      .attr('class', 'recession-block')
      .attr('x', chartX(new Date('2007-12-01')))
      .attr('y', -10)
      .attr('width', chartX(new Date('2009-06-01')) - chartX(new Date('2007-12-01')))
      .attr('height', cHeight + 10)
      .attr('fill', 'rgba(255,0,0,0.1)');

    // g.append('line')
    //   .attr('class', 'origin-line')
    //   .attr('x1',chartX(new Date('2004-01-01')))
    //   .attr('y1',chartY(data[0].employment))
    //   .attr('x2',chartX(new Date('2014-03-01')))
    //   .attr('y2',chartY(data[0].employment));

    var bbox = industry.bbox;
    bbox.x1 = cMargin.left;
    bbox.x2 = cMargin.left + cWidth;

    // Line bbox.

    // bbox.y1 = svgPos.top + cMargin.top - MARGIN_UP + Math.max(0 - cMargin.top, y(yExtent[1]));
    // bbox.y2 = svgPos.top + cMargin.top - MARGIN_UP + Math.min(height + cMargin.top + cMargin.bottom, y(yExtent[0]));

    var topYpx = chartY(yExtent[1]);
    var bottomYpx = chartY(yExtent[0]);

    // Circle bbox.
    var yBasis = cMargin.top;
    bbox.y1 = yBasis + topYpx;
    bbox.y2 = yBasis + bottomYpx;

    bbox.height = bbox.y2 - bbox.y1;
    bbox.width = bbox.x2 - bbox.x1;
    bbox.cx = bbox.x1 + (bbox.width / 2);
    bbox.cy = bbox.y1 + (bbox.height / 2);

    // Show bounding box.
    // $('<div>')
    //   .css({
    //     position: 'absolute',
    //     left: bbox.x1,
    //     top: bbox.y1,
    //     width: bbox.width,
    //     height: bbox.height,
    //     background: 'rgba(255,0,0,0.1)'
    //   })
    //   .appendTo(el);

    // industry.xFudge = -(svgPos.left + (chartWidth / 2));
    // industry.yFudge = -255;
    industry.xFudge = 0;
    industry.yFudge = 0;
  };

  var legendG, markerDots;
  function renderLegend() {
    var w = spaceWidth, h = spaceHeight;
    if (legendG) legendG.remove();
    legendG = d3.select('#graphic-bg')
      .attr('width', w)
      .attr('height', h)
      .append('g');

    legendG.append('rect')
      .attr('class', 'legend-gray')
      .attr('x',  55)
      .attr('y', 50)
      .attr('width', w - 105)
      .attr('height', h - 100);

    var markerG = legendG.append('g')
      .attr('class', 'markers');

    markerDots = markerG.selectAll('.marker')
      .data(sections)
    .enter().append('circle')
      .attr('class', 'marker')
      .attr('data-section', function(d){ return d.category; })
      .attr('r', 4)
      .attr('cx', spaceWidth - margin.right - 50)
      .attr('cy', function(d, i) {
        return (margin.top / 2) + (i * 22);
      });    

    legendG.append('path')
      .attr('class', 'h-line')
      .attr('d', 'M ' + (margin.left - 10) + ' ' + spaceY(0) + ' L ' + (w - 35) + ' ' + spaceY(0));

    // legendG.append('path')
    //   .attr('class', 'h-line')
    //   .attr('d', 'M ' + w / 2 + ' 0 L ' + w / 2 + ' ' + h);

    // var xAxis = d3.svg.axis()
    //   .scale(spaceX)
    //   .tickValues([10, 20, 30, 40, 50])
    //   .tickFormat(prettyMoney)
    //   .tickSize(-(spaceHeight - margin.top - margin.bottom))
    //   .tickPadding(10)
    //   .orient('bottom');

    // var yAxis = d3.svg.axis()
    //   .scale(spaceY)
    //   .tickValues([-0.5, -0.4, -0.3, -0.2, -0.1, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6])
    //   .tickFormat(prettyPct)
    //   .tickSize(-(spaceWidth - margin.left - margin.right))
    //   .tickPadding(7)
    //   .orient('left');

    // legendG.append('g')
    //   .attr('class', 'axis x-axis')
    //   .attr("transform", "translate(0," + (spaceHeight - margin.bottom) + ")")
    //   .call(xAxis);

    // legendG.append('g')
    //   .attr('class', 'axis y-axis')
    //   .attr("transform", "translate(" + (margin.left) + ", 0)")
    //   .call(yAxis);

    // var lowX = (spaceX(lowWageBreak));
    // legendG.append('path')
    //   .attr('class', 'h-line vertical')
    //   .attr('d', 'M ' + lowX + ' 0 L ' + lowX + ' ' + h);

    // var highX = (spaceX(highWageBreak));
    // legendG.append('path')
    //   .attr('class', 'h-line vertical')
    //   .attr('d', 'M ' + highX + ' 0 L ' + highX + ' ' + h);

    var labelFudge = 20;

    // // _.each([['Low Wage Jobs', 0.058, margin.left], ['Middle Wage Jobs', -0.041, lowX + labelFudge], ['High Wage Jobs', 0.071, highX + labelFudge]], function(pair) {
    // _.each([['Low Wage Jobs', 0.058, margin.left], ['Middle Wage Jobs', -0.041, lowX + ((highX - lowX) / 2)], ['High Wage Jobs', 0.071, highX + ((w - highX )/ 2)]], function(pair) {
    //   legendG.append('text')
    //     .attr('class', 'legend-text-top vertical')
    //     .attr('x', pair[2])
    //     .attr('y', h - 15)
    //     .attr('text-anchor', pair[2] == margin.left ? 'left' : 'middle')
    //     // .attr('text-anchor', 'left')
    //     .text(pair[0] + ' ')
    //       .append('tspan')
    //       .attr('class', 'legend-text-pct')
    //       .text(prettyAccuratePct(pair[1]));
    // });

    renderAxis(margin.left - 30, spaceY(0) - 82, 'Jobs since recession', 'Increased', true, true);
    renderAxis(margin.left - 30, spaceY(0) + 82, null, 'Decreased', false, true);
    renderAxis(w / 2 - 55, h - margin.bottom + 35, 'Industries', 'Lower Wages', true, false);
    renderAxis(w / 2 + 55, h - margin.bottom + 35, null, 'Higher Wages', false, false);

    function renderAxis(x, y, centerText, text, arrowDir, axisDir) {
      if (centerText) {
        var cx = axisDir ? x : (w / 2);
        var cy = axisDir ? (spaceY(0)) : y;
        legendG.append('text')
        .attr('class', 'legend-text center-text')
        .attr('text-anchor', 'middle')
        .attr('transform', 'translate(' + cx + ',' + cy + ') ' + (axisDir ? 'rotate(270)' : ''))
        .text(centerText)
      }

      legendG.append('text')
        .attr('class', 'legend-text')
        .attr('text-anchor', (arrowDir ? axisDir : !axisDir) ? 'start' : 'end')
        .attr('transform', 'translate(' + x + ',' + y + ') ' + (axisDir ? 'rotate(270)' : ''))
        .text(text);

      legendG.append("svg:defs").selectAll("marker")
         .data(["arrow"])
       .enter().append("svg:marker")
         .attr("id", String)
         .attr("viewBox", "0 -5 10 10")
         .attr("refX", 0)
         .attr("refY", 0)
         .attr('stroke-width', 0)
         .attr("markerWidth", 12)
         .attr("markerHeight", 10)
         .attr("orient", "auto")
         .append("svg:path")
         .attr("d", "M 0,-3 L 11,0 L 0,3 ");

      if (axisDir) {
        var y1 = (arrowDir ? -68 : 70);
        legendG.append("svg:line")
           .attr("x1", x - 4)
           .attr("y1", y + y1)
           .attr("x2", x - 4)
           .attr("y2", y + y1 + (arrowDir ? -22 : 22))
           .attr("class", "legend-arrow")
          .attr("marker-end", "url(#arrow)");
      } else {
        var x1 = (arrowDir ? -90 : 93);
        legendG.append("svg:line")
           .attr("x1", x + x1)
           .attr("y1", y - 4)
           .attr("x2", x + x1 + (arrowDir ? -22 : 22))
           .attr("y2", y - 4)
           .attr("class", "legend-arrow")
          .attr("marker-end", "url(#arrow)");
      }
    };
  };

  var danceTimeout;
  function dance(month) {
    var maxMonth = cesData[0].wages.length - 1;
    if (month > maxMonth) return;
    var date = cesData[0].alignedData[month].date;
    timeText.text(datefmt(date));
    _.each(cesData, function(row) {
      place(row, month);
      move(row);
    });
    danceTimeout = setTimeout(function(){
      dance(month + 1);
    }, 500);
  }

  function place(industry, month) {
    var wage = industry.wages[month].wage;
    var emp = industry.alignedData[month].employment;
    var chgEmp = (emp - industry.empdec07) / industry.empdec07;
    industry.spaceX = spaceX(wage) - industry.bbox.cx + industry.xFudge;
    // industry.spaceX = spaceX(emp) - industry.bbox.cx + industry.xFudge;
    industry.spaceY = spaceY(chgEmp) - industry.bbox.cy + industry.yFudge;
    industry.x = industry.finalX = industry.spaceX;
    industry.y = industry.finalY = industry.spaceY;
    // industry.radius = bigBubbleScale(emp);
  }

  function setTablePosition(industry) {
    industry.tableEl || (industry.tableEl = $('.ces-' + industry.cescode));
    var industryTablePos = industry.tableEl.position();
    industry.tableX = industryTablePos.left + (tablePos.left - graphicPos.left) - 12;
    industry.tableY = tablePos.top - graphicPos.top + industryTablePos.top;
  }

  function placeTable(industry) {
    setTablePosition(industry);
    industry.x = industry.tableX;
    industry.y = industry.tableY;
  }

  function togglePlacement() {
    graphicPos = graphic.offset();
    tablePos = theTable.offset();
    inTransition = true;
    closeTile();
    var month = atOrigin ? 0 : lastWageMonth;
    container.toggleClass('at-origin', atOrigin);
    container.toggleClass('not-at-origin', !atOrigin);
    _.each(cesData, function(row) {
      place(row, month);
      if (display == 'table') placeTable(row);
      move(row);
    });
    notInTransition();
    toggleKey();
  }
  window.togglePlacement = togglePlacement;

  function move(industry) {
    // industry.bubble.attr('r', industry.radius);
    $(industry.element).css({
      transform: 'translate(' + Math.round(industry.x) + 'px, ' + Math.round(industry.y) + 'px)'
    });
  }

  var inTransition = false;
  function transitionBetween() {
    inTransition = true;
    container.removeClass('show-all show-table');
    if (display == 'all') {
      container.addClass('in-transition');
      sectors = altsectors;
      currentSector = noSector;
      _.each(cesData, function(industry) {
        industry.x = industry.finalX;
        industry.y = industry.finalY;
        move(industry);
      });
      setSector();
      var toDelay = function(){
        container.removeClass('in-transition').addClass('show-all');
        // _.delay(function() {
        //   theTable.addClass('no-height');
        // }, 500);
      };
    } else if (display == 'table') {
      sectors = catsectors;
      currentSector = sectors[0];
      _.each(cesData, function(industry) {
        placeTable(industry);
        move(industry);
      });
      var toDelay = function() {
        container.removeClass('in-transition').addClass('show-table');
        setSector();
      };
    }
    _.delay(toDelay, 550);
    notInTransition();
    $('.filter-' + display).addClass('selected');
  }

  function notInTransition() {
    _.delay(function(){ inTransition = false; }, 1000);
  }

  function eachMonth(callback) {
    _.each(YEARS, function(year) {
      _.each(_.range(1, 13), function(month) {
        if (year >= 2014 && month > 4) return;
        if (month < 10) month = "0" + month;
        var dateString = year + '-' + month + '-01';
        var date = new Date(Date.parse(dateString));
        callback(dateString, date);
      });
    });
  }

  function processCesData() {
    var ces = originalCesData;
    var wages = _.indexBy(originalWageData, function(row) {
      return row.seriesid.replace(/(^CES0?|03$)/g, '');
    });
    for (var i = 0; i < ces.length; i++) {
      var row = ces[i];
      row.data = [];
      row.wages = [];
      row.bbox = {};
      if (row.alternacategory) {
        row.alternacategory = row.alternacategory.split(/, ?/g);
      }
      nytcats[row.nytcategory] = true;
      eachMonth(function(dateString, date) {
        row.data.push({
          datestr: dateString,
          date: date,
          employment: (+row[dateString]) * 1000
        });
        if (!wages[row.cescode]) return;
        var avgWage = wages[row.cescode][dateString];
        if (avgWage) {
          if (!adjInflation[dateString]) throw new Error("no wage " + row.cescode + ' ' + row.industry + ' ' + dateString);
          avgWage = adjInflation[dateString] * parseFloat(avgWage, 10);
          row.wages.push({
            datestr: dateString,
            date: date,
            wage: avgWage
          });
        }
      });
      row.alignedData = _.filter(row.data, function(d) {
        return d.date >= new Date('2007-12-01');
      });
      row.empFirst = row.data[0].employment;
      row.empLast = row.data[row.data.length - 1].employment;
      row.empdec07 = _.where(row.data, {datestr: '2007-12-01'})[0].employment;
      row.empdec09 = _.where(row.data, {datestr: '2009-12-01'})[0].employment;
      row.chgSinceQ4Oh7 = (row.empLast - row.empdec07) / row.empdec07;

      if (row.wages.length) {
        row.firstWage = row.wages[0].wage;
        row.finalWage = row.wages[row.wages.length - 1].wage;
        row.finalSalary = row.finalWage * BLS_HOURS_IN_WORK_YEAR;
      }
      if (!row.wages.length) {
        console.warn("No Wage For: ", row.industry);
      }
      classify(row);
    }

    findWageBreaks(ces);
    _.each(ces, wageClassify);

    if (showPicks) {
      ces = _.where(ces, {showrow: '1'});
    }

    // ces = _.where(ces, {cescode: '20236115'});

    // // Hide the ones we don't have wage data for.
    // ces = _.filter(ces, function(row) {
    //   if (!row.avgwage) console.log(row.cescode, row.industry);
    //   return !!row.finalWage;
    // });

    // Limit the outliers.
    // ces = _.filter(ces, function(row) {
    //   var tooMuchChange = (Math.abs(row.chgSinceQ4Oh7) > 0.45);
    //   var tooSmall = row.empLast < 50000;
    //   var tooBig = row.empLast > 4000000;
    //   return !(tooMuchChange || tooSmall || tooBig);
    // });

    // Limit the amount to render.
    // ces = ces.slice(0, 5);

    lastWageMonth = ces[0].alignedData.length - 1;
    missingWages = ces[0].data.length - ces[0].wages.length;

    chartX = d3.time.scale()
      .rangeRound([0, cWidth])
      .domain(d3.extent(ces[0].data, function(d){ return d.date; }));

    window.nytcats = _.compact(_.keys(nytcats));
    window.cesData = ces;
    window.indexedCes = _.indexBy(ces, 'cescode');
  }

  // Convert the list of industries into a heirarchical tree ... and a lookup
  // table by NAICS code.
  function processIndustries(raw) {
    var match;
    _.each(raw, function(row) {
      var code = row.industry_code;
      var codes = [code];
      if (!/^\d+$/.test(code)) {
        var tuple = code.split('-');
        var first = parseInt(tuple[0], 10);
        var last = parseInt(tuple[1], 10);
        codes = _.range(first, last + 1);
      }
      var parent = code;
      var title = row.industry_title.replace(/^NAICS\d* [\d-]+ /, '');
      var record = {code: code, title: title, sub: [], rendered: false};
      industryLookup[code] = record;
      _.each(codes, function(code) {
        industryLookup[code] = record;
      });
      if (codes.length == 1) {
        while (parent.length > 1) {
          parent = parent.substr(0, parent.length - 1);
          if (match = industryLookup[parent]) {
            match.sub.push(record);
            return;
          }
        }
      }
      industries.push(record);
    });
    return industries;
  }

});

define("script", function(){});

