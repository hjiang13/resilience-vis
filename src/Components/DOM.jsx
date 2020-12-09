import React, { Component } from "react";
import * as d3 from "d3";
import "guans-style";
import "../style/style.css";
import axios from 'axios';
import * as dat from 'dat.gui';


class DOM extends Component {
  constructor(props) {
    super(props);
    this.state = {
      item: "react component",
      clusterByKey:{},
      goldenByKey:{},
      errByKey:{},
      diffList_union:{},
      clusterArr:[],


      cluster:'',
      click_flag:false,
      threshold: 0,
      clusterId:'',

      /* 两种setting，分别是全局模式和local模式 */
      global_setting:{
        if_global: true,
        force:-5,
        only_filter: false,
      },

      local_setting:{
        if_global: false,
        force:-400,
      },

      /* injection node */
      /* 在这里修改注入错误的节点 */
      injectNode : {
        _gvid: undefined,
        id:'0x400667',
        cluster: 'cluster_12'
      }
    };

    this.heightHandle = this.heightHandle.bind(this);
    this.initTxt_parseDiff = this.initTxt_parseDiff.bind(this);
    this.initJson_parseLayout = this.initJson_parseLayout.bind(this);
    this.drawOvVw = this.drawOvVw.bind(this)
    this.drawRv = this.drawRv.bind(this)
    this.globalHandle = this.globalHandle.bind(this)
    this.filterHandle = this.filterHandle.bind(this)
    this.init_legend = this.init_legend.bind(this)
    this.clickLabel = this.clickLabel.bind(this)
    this.initGUI = this.initGUI.bind(this)
    
    
    
  }

  /* height: 图的高度 */
  /* d: 需要计算的节点 */
  /* stratify: 原数组 */
  heightHandle(height, d, stratify) {
    let maxDepth = d3.max(
      stratify.descendants().reduce(function (prev, cur) {
        prev.push(cur.depth);
        return prev;
      }, [])
    );

    return ((height - 100) / (maxDepth + 2)) * (d.depth + 1);
  }


  init_legend(svg){
    
  let lengendArr = {
    group:[
      'head','tail','body'
    ],
    style:[
      '#ffc107','#e83e8c','#d4dbff'
    ]
  }



  let legend = svg
  .append('g')
  .attr('transform',function(){return `translate(60,90)`})
  .attr('class','lengend')
  .selectAll('g')
  .data(lengendArr.style.map((d,i)=>{
    return {
      style:d,
      name:lengendArr.group[i]
    }
  }))
  .enter()
  .append('g')
  .attr('transform',function(d,i){return `translate(0,${30*i})`})
  
  legend
  .append('circle')
  .attr('r',10)
  .attr('fill',function(d){return d.style})

  legend
  .append('text')
  .text(function(d){return d.name})
  .attr('dx',30)
  .attr('dy',5)

  }


  drawOvVw(clusterByKey){

    /* 切换global和local模式靠的是数据改变 ，样式渲染变化靠的是内部的一个判断if(mode){}*/
    /* 切换global和filter模式靠的是数据的改变 */

    // console.log(clusterByKey);

    let keys = Object.keys(clusterByKey),
    values = Object.values(clusterByKey),
    entries = Object.entries(clusterByKey),
    _this = this

    var svg = d3.select("#svg-overview").attr("width", 1200).attr("height", 130);

    let width = 1200,
    height = 80,
    paddingLeft = 40, 
    paddingRight = 40,
    paddingTop = 30,
    paddingBottom = 30,
    innerRadius = 4,
    radius = 15,
    intervel = (width-paddingLeft-paddingRight-2*radius)/(entries.length-1)

    /* 计算overview的clusterNode的坐标 */
    function clusterNodePos(i,entries){
        let x =  paddingLeft+radius+i*intervel
        let y = height/2;
        return {
            "x":x,
            "y":y
        }
    }

    /* 这之间的算法是计算cluster连接处的状态的 */
    let goldenByKey = this.state.goldenByKey,
    errByKey = this.state.errByKey,

    /* diffList_union是全部的diff数组，不看是哪个cluster的，因为有连接处的diff */
    diffList_union = {}

    for(let key in goldenByKey){
        diffList_union[key] = Math.abs(errByKey[key].value-goldenByKey[key].value)
    }
    this.setState({
        "diffList_union":diffList_union
    })

    for(let key in diffList_union){
        if(diffList_union[key] != 0){
            let [source, target] = key.split('to')
            for(let key_cluster in clusterByKey){
                let idArr = [];
                clusterByKey[key_cluster].nodes.forEach(d=>{
                    idArr.push(d.id)
                })
                // if(idArr.includes(source) && idArr.includes(target)){
                //     let temObj = {}
                //     temObj.diff = diffList_union[key];
                //     temObj.distribution = [].push(key_cluster);
                //     diffList_union[key] = temObj;
                // }else  if(idArr.includes(source) && !idArr.includes(target)){
                //     let temObj = {}
                //     temObj.diff = diffList_union[key];
                //     temObj.distribution = [].push(key_cluster);
                //     diffList_union[key] = temObj;
                // }else if(!idArr.includes(source) && idArr.includes(target)){

                // }

                if(idArr.includes(source) || idArr.includes(target)){
                    if(!diffList_union[key].distribution){
                        let temObj = {}
                        temObj.diff = diffList_union[key];
                        temObj.distribution = [key_cluster];
                        diffList_union[key] = temObj;
                    }else{
                        diffList_union[key].distribution.push(key_cluster)
                    }
                }
            }
        }else{
            diffList_union[key] = {
                'diff': 0,
                'distribution': undefined
            }
        }
    }
    /* 这之间的算法是计算cluster连接处的状态的 */

    global.data = {
                "diffList_union": diffList_union
                }

    


    let node = svg
    .selectAll('g')
    .data(entries)
    .enter()
    .append('g')
    .attr('class','overview')
    .attr('transform',function(d,i){return `translate(${clusterNodePos(i,entries).x},${clusterNodePos(i,entries).y})`})

    node.append('line')
    .attr('x1',0)
    /* 如果是最后一个line，就不画；否则画 */
    .attr('x2',function(d,i){return i == entries.length-1?0:intervel})
    .attr('y1',0)
    .attr('y2',0)
    .attr('stroke', function(item,i){
        let color = 'green';
        Object.values(diffList_union).forEach((d,i)=>{
            if(d.distribution && d.distribution.length == 2){
                let clusterNum = item[0].split('_')[1]
                let diffNum = [d.distribution[0].split('_')[1], d.distribution[1].split('_')[1]]
                    if(diffNum.includes(clusterNum) && diffNum.includes(String(Number(clusterNum)+1))){
                        color =  "#dc3545"
                    }
            }
        })
        return color
    })

    // let outer = node.append('circle')
    // .attr('class','outer')
    // .attr('r',radius)
    // .attr('fill',function(d){
    //     /* 根据cluster中是否包含diff不为0来确定node的颜色 */
    //     return d[1].links.some(value=>{return value.diff != 0})?'#dc3545':'green'
    // })
    // .on('click',function(d){
    //   _this.drawRv(clusterByKey[d[0]],_this.state.local_setting)
    //   _this.setState({
    //     cluster: d[1].label
    //   })
    // })
  



    node.append('circle')
    .attr('class','inner')
    .attr('r',innerRadius)
    .attr('fill',function(d){
        /* 根据cluster中是否包含diff不为0来确定node的颜色 */
        return d[1].links.some(value=>{return value.diff != 0})?'#dc3545':'green'
    })
    .on('click',function(d){
      _this.drawRv(clusterByKey[d[0]],_this.state.local_setting)
      _this.setState({
        cluster: d[1].label
      })
    })
    .on('mouseover',function(){
      d3.select(this)
      .transition()
      .duration(200)
      .attr('r',innerRadius+1.5)
    })
    .on('mouseout',function(){
      d3.select(this)
      .transition()
      .duration(200)
      .attr('r',innerRadius)
    })

    node
    .append('path')
    .attr('d',function(d){
      return (
        `M 0 -10  L 5 -20 L -5 -20 Z`
      )
    })
    .attr('stroke','purple')
    .attr('fill','purple')
    // .text(function(d){return 'inject'})
    // .attr('dx', -intervel/2)
    .attr('dy', function(d,i){
        return i%2 == 0?radius+3*innerRadius:-radius-innerRadius
    })
    .style('display',function(d){
      return d[0]==_this.state.injectNode.cluster?'display':'none'
    })

    node
    .append('path')
    .attr('d',function(d){
      return (
        `M 0 10  L 5 20 L -5 20 Z`
      )
    })
    .attr('stroke','purple')
    .attr('fill','purple')
    // .text(function(d){return 'inject'})
    // .attr('dx', -intervel/2)
    .attr('dy', function(d,i){
        return i%2 == 0?radius+3*innerRadius:-radius-innerRadius
    })
    .style('display',function(d){
      return d[0]==_this.state.injectNode.cluster?'display':'none'
    })
    
    node.append('title')
    .text(function(d){
      return d[1].label
    })


    // this.init_legend(svg)
 

}

  globalHandle(){
    /* 点击再渲染，这样可以不用牵扯到js的异步读取 */
    /* 下面的clg可行 */
    // console.log(this.state.clusterByKey);

    /* 更新filter的状态，然后传入渲染函数 */
    let update_onlyFilter = false
    this.setState({
      global_setting:{
        force:-20,
        if_global: true,
        only_filter: update_onlyFilter
      },
    })
    this.drawRv(this.state.clusterByKey,this.state.global_setting)
    
    this.setState({
      cluster:''
    })
  }

  filterHandle(){
    /* 更新filter的状态，然后传入渲染函数 */
    let update_onlyFilter = true
    this.setState({
      global_setting:{
        force:-20,
        if_global: true,
        only_filter: update_onlyFilter
      },
    })
    this.drawRv(this.state.clusterByKey,this.state.global_setting)
    
    this.setState({
      cluster:''
    })
  }


  drawRv(clusterByKey,setting){
    global.data.clusterByKey = clusterByKey

    /* parse setting */
    let force = setting.force,
    mode = setting.if_global
      
    const width = 900,
    height = 840;

    const radius = 6,
    rectWidth = 12,
    rectHeight = 12,
    rectWidthHover = 72,
    rectHeightHover = 24,
    rx = rectWidth/2,
    ry = rectHeight/2,
    lightRadius = 3, 
    paddingLeft = 60, 
    paddingRight = 60,
    paddingTop = 20,
    paddingBottom = 20,
    overviewHieght = 130,
    radius_local = 20,

    _this = this


/* 根据only_filter的值来决定数组nodes和links */
    let nodes = [], links = []

    if(!this.state.global_setting.only_filter){
      if(! ('id' in clusterByKey)){
        Object.values(clusterByKey).forEach(d=>{
          nodes = [...nodes, ...d.nodes]
      })

      Object.values(clusterByKey).forEach(d=>{
          links = [...links, ...d.links]
        })  
      }else{
        nodes = clusterByKey.nodes
        links = clusterByKey.links
      }
    }else{
    /* 下面构造filter下的数组 */    
      if(! ('id' in clusterByKey)){
        Object.values(clusterByKey).forEach(d=>{
          let res = d.links.some((val,index)=>{
            return val.diff != 0
          })
          if(res){
            nodes = [...nodes, ...d.nodes]
          }
      })
  
        Object.values(clusterByKey).forEach(d=>{
          let res = d.links.some((val,index)=>{
            return val.diff != 0
          })
          if(res){
            links = [...links, ...d.links]
          }
        })  
      }else{
        nodes = clusterByKey.nodes
        links = clusterByKey.links
      }
    }


    /* HEREEEEEEEEEEEEEEEEEEEEEEEEEEE */


     // for(let key in this.state.diffList_union){
    //     let [source, target] = key.split('to')
    //     if(links.every(d=>{
    //         return (source != d.source.id) && (target !=d.target.id)
    //     })){
    //         links.push({
    //             "diff": this.state.diffList_union[key].diff,
    //             "source": {"id":source},
    //             "target": {"id":target}
    //         })
    //     }
    // }

  var svg = d3.select("#svg-rv").attr("width", width).attr("height", height);

  svg.selectAll("*").remove();
  
this.init_legend(svg)


  let div = d3.select('body')
  .append('div')
  .attr('id','tooltip')
  .style('opacity',0)  

    /* start to build graph */
    /* +引力  -斥力 */
    let simulation = d3
      .forceSimulation()
      .force(
        "link",
        d3.forceLink().id(function (d) {
          return d.id;
        })
      )
      .force("charge", d3.forceManyBody().strength(force))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force(
        "r",
        d3
          .forceRadial()
          .radius(width / 2, height / 2)
          .strength(0.01)
      );
    // .force("y", d3.forceY())

    /* 结束构造simulation*/


    /* 映射线条粗细的比例尺 */
    let scale = d3.scaleLinear().domain(d3.extent(links.map(d=>{return d.goldenValue}))).range([1.5,3])


    let link_g = svg
    .append('g')
    .attr("class", "links")
    .selectAll('g')
    .data(links)
    .enter()
    .append('g')


    let link, node, link_text
      
  /* 全局模式下隐藏id */
  if(mode){
    
    /* 开始画点和线 */
    link = link_g
      .append("line")
      .style('stroke',function(d){
        return d.diff<=_this.state.threshold?"rgb(192, 189, 189)":'red'
      })
      .style('stroke-width',function(d){
        return scale(d.goldenValue)
      })

    link_text = link_g
    .append('text')
    .attr('style','link_text')
    .text(function(d){return d.diff;})
    // .attr('dx','-10px')

    node = svg
      .append("g")
      .attr("class", "nodes")
      .selectAll('g')
      .data(nodes)
      .enter()
      .append('g')
      .on('mouseover',mouseover_circle)
      .on('mouseout',mouseout_circle)
      .on('click',click_circle)
      .on('dblclick',dblclick_circle)
      .call(
        d3
          .drag()
          .on("start", dragstarted)
          .on("drag", dragged)
          .on("end", dragended)
      );



    let circle = node
      .append("rect")
      .attr("width", rectWidth)
      .attr('height', rectHeight)
      .attr('rx', rx)
      .attr('ry', ry)
      .attr('transform', function(){return `translate(${-rectWidth/2},${-rectHeight/2})`})
      .attr('fill', function(d){
        return d.position == 'head'?'orange':(d.position == 'tail'?'pink':'#d4dbff')
      })

      
      let hoverTrigger = node
      .append('circle')
      .attr('class','circle')
      .attr('r',lightRadius)

      let text = node
      .append('text')
      .attr('x',0)
      .attr('y',0)
      .attr('dx',lightRadius*2)
      .attr('dy',rectHeightHover/2)
      .text(function(d){return d.id})
      .style('display','none')

      
    /* arrow line */
    svg
    .append("defs")
    .append("marker")
    .attr("id", "marker")
    .attr('width',100)
    .attr('height',100)
    .attr("viewBox", "0 -5 10 5")
    .attr("refX", 15)
    .attr("markerWidth", 4)
    .attr("markerHeight", 6)
    .attr("orient", "auto")
    .append("path")
    .attr("d", "M0,-5L10,0L0,5");
  }
  /* 局部模式下显示id */
  else{
    
    /* 开始画点和线 */
    link = link_g
      .append("line")
      .style('stroke',function(d){
        return d.diff<=_this.state.threshold?"rgb(192, 189, 189)":'red'
      })
      .style('stroke-width',function(d){
        return scale(d.goldenValue)
      })


    node = svg
      .append("g")
      .attr("class", "nodes")
      .selectAll('g')
      .data(nodes)
      .enter()
      .append('g')
      .on('click',click_circle_local)
      .on('dblclick',dblclick_circle_local)
      .call(
        d3
          .drag()
          .on("start", dragstarted)
          .on("drag", dragged)
          .on("end", dragended)
      )
      // .each(function(d){console.log(d);})


    let circle = node
      .append("circle")
      .attr('class','circle_local')
      .attr("r", radius_local)
      .attr('fill', function(d){
        return  `0x${d.id}`===_this.state.injectNode.id?'purple':(d.position == 'head'?'orange':(d.position == 'tail'?'pink':'#d4dbff'))
      })
      
      // .attr('transform', function(){return `translate(${-rectWidth/2},${-rectHeight/2})`})

      let text = node
      .append('text')
      .attr('class','text_local')
      .attr('x',0)
      .attr('y',0)
      .attr('dx',-17)
      .attr('dy',5)
      .text(function(d){return `0x${d.id}`})

      
    /* arrow line */
    svg
    .append("defs")
    .append("marker")
    .attr("id", "marker")
    .attr("viewBox", "0 -5 10 5")
    .attr("refX", radius_local*2)
    .attr("markerWidth", 4)
    .attr("markerHeight", 6)
    .attr("orient", "auto")
    .append("path")
    .attr("d", "M0,-5L10,0L0,5");

    
    link_text = link_g
    .append('text')
    .attr('style','link_text')
    .text(function(d){return d.diff;})
    // .attr('dx','-20px')
    .attr('dy','-3px')
    .style('font-size','1em')
    .style('z-index','999')
     
  }


      


    simulation.nodes(nodes).on("tick", function () {
      link
        .attr("x1", function (d) {
          return Math.max(radius,Math.min(width - rectWidth, d.source.x));
        })
        .attr("y1", function (d) {
          return Math.max(radius,Math.min(height - rectWidth, d.source.y));
        })
        .attr("x2", function (d) {
          return Math.max(radius,Math.min(width - rectWidth, d.target.x));
        })
        .attr("y2", function (d) {
          return Math.max(radius,Math.min(height - rectHeight, d.target.y));
        })
        .attr("marker-end", "url(#marker)");

        link_text
        .attr('x',function(d){
          return (d.source.x+d.target.x)/2
        })
        .attr('y',function(d){
          return (d.source.y+d.target.y)/2
        })

      node
      //   .attr("cx", function (d) {
      //     return (d.x = Math.max(radius, Math.min(width - radius, d.x)));
      //   })
      //   .attr("cy", function (d) {
      //     return (d.y = Math.max(radius, Math.min(height - radius, d.y)));
      //   });
      .attr('transform',function(d){return `translate(${Math.max(radius, Math.min(width - rectWidth, d.x))},${Math.max(radius, Math.min(height - rectHeight, d.y))})`})
      // .attr("x", function(d) { return d.x = Math.max(radius, Math.min(width - rectWidth, d.x)) })
      // .attr("y", function(d) { return d.y = Math.max(radius, Math.min(height - rectHeight, d.y)) });
    });

    simulation.force("link").links(links);





    /* 开始定义一些函数 */
    function dragstarted(d) {
      if (!d3.event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(d) {
      d.fx = d3.event.x;
      d.fy = d3.event.y;
    }

    function dragended(d) {
      if (!d3.event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }

    global.d3 = d3
    
  //交互：tooltip  mouseover
  function mouseover_circle(d,i){
      let _this = this.parentNode;

      d3.select(this)
      .select('text')
      .transition()
      .duration(50)
      .style('display','block')

      d3.select(this)
      .select('rect')
      .transition()
      .duration(100)
      .attr('width', rectWidthHover)
      .attr('height', rectHeightHover)

      
          

  }

  function mouseout_circle(d,i){

    

      if(!_this.state.click_flag){
        d3.select(this)
        .select('text')
        .transition()
        .duration(50)
        .style('display','none')
  
        d3.select(this)
        .select('rect')
        .transition()
        .duration(100)
        .attr('width', rectWidth)
        .attr('height', rectHeight)

      }
      
   
  }

  function click_circle(d){
    _this.setState({click_flag:true})

    d3.select(this)
    .select('text')
    .transition()
    .duration(50)
    .style('display','block')

    d3.select(this)
    .select('rect')
    .transition()
    .duration(100)
    .attr('width', rectWidthHover)
    .attr('height', rectHeightHover)

    let [gX,gY] = d3.select(this).attr('transform').match(/(\d+\.?\d+)/g)

    d3.select('#tooltip')
        .transition()
        .delay(50)
        .style('opacity', 0.9);
    d3.select('#tooltip')
        .html(`<font color="#6610f2">_gvid:</font> ${d._gvid}</br><font color="#6610f2">id:</font>0x${d.id}</br><font color="#6610f2">label:</font> ${d.label}</br><font color="#6610f2">index:</font> ${d.index}`)
        .style('left', `${Number(gX)-radius+20}px`)
        .style("top", `${Number(gY)+rectHeightHover+paddingTop*2+overviewHieght}px`);
  }

  function dblclick_circle(d){

    _this.setState({click_flag:false})


    d3.select(this)
    .select('text')
    .transition()
    .duration(50)
    .style('display','none')

    d3.select(this)
    .select('rect')
    .transition()
    .duration(100)
    .attr('width', rectWidth)
    .attr('height', rectHeight)

    d3.select('#tooltip')
    .transition()
    .duration(50)
    .style('opacity', 0);
  }

  function click_circle_local(d){
    
    let [gX,gY] = d3.select(this).attr('transform').match(/(\d+\.?\d+)/g)

    d3.select('#tooltip')
        .transition()
        .delay(50)
        .style('opacity', 0.9);
    d3.select('#tooltip')
        .html(`<font color="#6610f2">_gvid:</font> ${d._gvid}</br><font color="#6610f2">id:</font>0x${d.id}</br><font color="#6610f2">label:</font> ${d.label}</br><font color="#6610f2">index:</font> ${d.index}`)
        .style('left', `${Number(gX)-radius+20}px`)
        .style("top", `${Number(gY)+rectHeightHover+paddingTop*2+overviewHieght}px`);
  }

  function dblclick_circle_local(d){
    d3.select('#tooltip')
    .transition()
    .duration(50)
    .style('opacity', 0);
  }
  }


  clickLabel(d){
    // console.log(this.state.clusterByKey);
    // console.log(this.state.clusterByKey[d.id]);
    this.drawRv(this.state.clusterByKey[d.id],this.state.local_setting)
      this.setState({
        cluster: d.label,
        clusterId: d.id
      })
  }

  /* 
  return {
      "goldenByKey": goldenByKey,
      "errByKey": errByKey
  }
  */
  initTxt_parseDiff(){

    let linkKey, linkSeprt = "to", goldenByKey = {}, errByKey = {};

    axios.get('../../statics/LSG_1.txt')
    .then(txt=>{
        txt = txt.data

        let links = txt.split(/[\n]+/).map((d, i) => {
            let tem = d.split(/[\s->:?\s]+/);
            return {
              source: tem[0],
              target: tem[1],
              value: Number(tem[2]),
            };
          });
      
      
          for(let i = 0;i<links.length;i++){
              linkKey = links[i].source + linkSeprt + links[i].target;
              goldenByKey[linkKey] = links[i]
          }
      
          // console.log(goldenByKey);
      
          // let m = links.reduce((arr, cur) => {
          //   if (arr.includes(cur.source) === false) {
          //     arr.push(cur.source);
          //     return arr;
          //   }
          //   return arr;
          // }, []);
      
          // let nodes = links.reduce((arr, cur) => {
          //   if (arr.includes(cur.target) === false) {
          //     arr.push(cur.target);
          //     return arr;
          //   }
          //   return arr;
          // }, m);
      
          // nodes = nodes.map((d, i) => {
          //   return {
          //     id: d,
          //   };
          // });
        /* 结束构造数组 */
      //   console.log(nodes,links);
      this.setState({
          goldenByKey: goldenByKey
      })

      global.goldenByKey = goldenByKey

    })

    axios.get("../../statics/LSG_153.txt")
    .then(txt=>{
        txt = txt.data

        let links = txt.split(/[\n]+/).map((d, i) => {
            let tem = d.split(/[\s->:?\s]+/);
            return {
              source: tem[0],
              target: tem[1],
              value: Number(tem[2]),
            };
          });
      
      
          for(let i = 0;i<links.length;i++){
              linkKey = links[i].source + linkSeprt + links[i].target;
              errByKey[linkKey] = links[i]
          }
      
          // let m = links.reduce((arr, cur) => {
          //   if (arr.includes(cur.source) === false) {
          //     arr.push(cur.source);
          //     return arr;
          //   }
          //   return arr;
          // }, []);
      
          // let nodes = links.reduce((arr, cur) => {
          //   if (arr.includes(cur.target) === false) {
          //     arr.push(cur.target);
          //     return arr;
          //   }
          //   return arr;
          // }, m);
      
          // nodes = nodes.map((d, i) => {
          //   return {
          //     id: d,
          //   };
          // });
        /* 结束构造数组 */
      //   console.log(nodes,links);
      this.setState({
        errByKey: errByKey
    })
    })

  
 
//   return {
//       "goldenByKey": goldenByKey,
//       "errByKey": errByKey
//   }
}



/* 
计算结构+利用initTxt_parseDiff函数的结果计算diff, 得出clusterByKey的最终数组
*/
/* return clusterByKey;
 */  
initJson_parseLayout(input){

    axios.get('../../statics/bsort.json')
    .then(json=>{
        json = json.data;
        let clusterArr = [], nodesByKey = {}, edgesByKey = {}
        let clusterByKey = [], prefix = "$", clusterKey;
        let goldenByKey = this.state.goldenByKey,
        errByKey = this.state.errByKey
    
    
            json.objects.map((d,i)=>{
                if(d.name.match(/^cluster/)){
                    clusterArr.push(
                        {
                            '_gvid':d._gvid,
                            'id': d.name,
                            'nodes':d.nodes,
                            'edges':d.edges || undefined,
                            'color':d.color,
                            'label':d.label
                        }
                    )
                }else{
                    nodesByKey[d._gvid] = {
                        '_gvid':d._gvid,
                        'id':d.name,
                        'label':d.label,
                        'shape':d.shape
                    }
                }
            })
    
            json.edges.map((d,i)=>{
                edgesByKey[d._gvid] = {
                    "_gvid":d._gvid,
                    "source":d.tail,
                    "target":d.head,
                    'color':d.color || undefined,
                    "index":d.index
                }
            })

            global.clusterArr = clusterArr
            global.nodesByKey = nodesByKey
            global.edgesByKey = edgesByKey

            this.setState({
              clusterArr:clusterArr
            })
    
    
    // console.log(clusterArr);
    // console.log(nodesByKey);
            for(let i = 0;i<clusterArr.length;i++){
                clusterKey = clusterArr[i].id
                clusterByKey[clusterKey] = {};
                clusterByKey[clusterKey].nodes = [];
                clusterByKey[clusterKey].links = [];
                clusterArr[i].nodes.forEach((d,j)=>{
                  let position;
                  if(j==0){
                    position = 'head'
                  }else if(j==clusterArr[i].nodes.length-1){
                    position = 'tail'
                  }else{
                    position = 'body'
                  }
                    clusterByKey[clusterKey].nodes.push({
                      _gvid:nodesByKey[d]._gvid,
                      id:nodesByKey[d].id,
                      label:nodesByKey[d].label,
                      shape:nodesByKey[d].shape,
                      _gvid:nodesByKey[d]._gvid,
                      position: position
                    })
                })
                if(clusterArr[i].edges){
                    clusterArr[i].edges.forEach(d=>{
                        clusterByKey[clusterKey].links.push({
                            /* edgesByKey[d].target是“43” */
                            /* nodesByKey[edgesByKey[d].target].id是400472 */
                            'id': clusterKey,
                            'source': nodesByKey[edgesByKey[d].source].id,
                            "target": nodesByKey[edgesByKey[d].target].id,
                            "color": edgesByKey[d].color,
                            "index": edgesByKey[d].index,
                            "goldenValue": 
                                `${nodesByKey[edgesByKey[d].source].id}to${nodesByKey[edgesByKey[d].target].id}` in goldenByKey?
                                  goldenByKey[`${nodesByKey[edgesByKey[d].source].id}to${nodesByKey[edgesByKey[d].target].id}`].value : undefined,
                            "errValue": 
                            `${nodesByKey[edgesByKey[d].source].id}to${nodesByKey[edgesByKey[d].target].id}` in errByKey?
                                  errByKey[`${nodesByKey  [edgesByKey[d].source].id}to${nodesByKey[edgesByKey[d].target].id}`].value : undefined,
                            "diff": 
                              `${nodesByKey[edgesByKey[d].source].id}to${nodesByKey[edgesByKey[d].target].id}` in goldenByKey?
                                  Math.abs(errByKey[`${nodesByKey[edgesByKey[d].source].id}to${nodesByKey[edgesByKey[d].target].id}`].value - goldenByKey[`${nodesByKey[edgesByKey[d].source].id}to${nodesByKey[edgesByKey[d].target].id}`].value) : undefined,
                            "_gvid": edgesByKey[d]._gvid
                        })
                    })
                }
                clusterByKey[clusterKey].id = clusterArr[i].id;
                clusterByKey[clusterKey].label = clusterArr[i].label;
                clusterByKey[clusterKey].color = clusterArr[i].color;
            }

    
            global.clusterByKey = clusterByKey


            /* 最终数组 */
            // json(clusterByKey)
            this.setState({
              clusterByKey: clusterByKey
            })

            /* 引入drawOverview画上面的视图 */
            this.drawOvVw(clusterByKey)
      
            /* 引入drawRv画下面的视图 */
            // this.drawRv(clusterByKey,this.state.global_setting)
            
    })
    
  }

initGUI(){
  
        //定义gui配置项
        const controls = new function(){
          this.threshold = 0
      }

      const gui = new dat.GUI();


      /* 在这里修改thrshold的range */
      /* 0, 100 */
      gui.add(controls, 'threshold', 0, 100).name('Diff Threshold').step(1).onFinishChange(threshold=>{
        this.setState({
          threshold : threshold
        })
        this.drawRv(this.state.clusterByKey[this.state.clusterId],this.state.local_setting)    })
}
  

  componentDidMount() {
      
        /* 内部调用了draw函数 */
        this.initJson_parseLayout(this.initTxt_parseDiff());

  this.initGUI()


  }

  render() {

    let itemCardColor = ["#d54062", "#ffa36c", "#ebdc87", "#799351", "#557571", "#d49a89", "#a3d2ca", "#5eaaa8", "#056676", "#d8d3cd"]


    return (
      <div id="root">
          <div className='overview-container'>
              <svg id="svg-overview"></svg>
          </div>
        <div className="svg-container">
              <svg id="svg-rv"></svg>
              <h3>{this.state.cluster}</h3>
        </div>
        

        <button type="button" onClick={this.globalHandle} className="btn btn-outline-primary">Global View</button>
        <button type="button" onClick={this.filterHandle} className="btn btn-outline-primary">Filter</button>


        <div id='item-coat'>
            <div id="item" className='d-flex flex-column justify-content-between'>
                <div id="item-filtered" className="flex-grow-1">
                    <span className="title">Cluster: Number {this.state.clusterArr.length}</span>
                    {this.state.clusterArr.map((d,i)=>{
                        return <div style={{backgroundColor:itemCardColor[i%10]}} 
                          className="item-card rounded alert-info" 
                          key={i}
                          onClick={this.clickLabel.bind(this,d)}
                          >{d.label}</div>
                    })}
                </div>
            </div>
        </div>
      </div>
    );
  }
}

export default DOM;
