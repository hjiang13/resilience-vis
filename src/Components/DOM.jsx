import React, { Component } from "react";
import * as d3 from "d3";
import "guans-style";
import "../style/style.css";
import axios from 'axios'

class DOM extends Component {
  constructor(props) {
    super(props);
    this.state = {
      item: "react component",
      clusterByKey:{},
      goldenByKey:{},
      errByKey:{},
      diffList_union:{}
    };

    this.heightHandle = this.heightHandle.bind(this);
    this.initTxt_parseDiff = this.initTxt_parseDiff.bind(this);
    this.initJson_parseLayout = this.initJson_parseLayout.bind(this);
    this.drawOvVw = this.drawOvVw.bind(this)
    this.drawRv = this.drawRv.bind(this)
    
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




  drawOvVw(clusterByKey){

    let keys = Object.keys(clusterByKey),
    values = Object.values(clusterByKey),
    entries = Object.entries(clusterByKey)

    var svg = d3.select("#svg-overview").attr("width", 1200).attr("height", 130);

    let width = 1200,
    height = 130,
    paddingLeft = 60, 
    paddingRight = 60,
    paddingTop = 20,
    paddingBottom = 20,
    innerRadius = 7,
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

    node.append('circle')
    .attr('class','outer')
    .attr('r',radius)
    .attr('fill',function(d){
        /* 根据cluster中是否包含diff不为0来确定node的颜色 */
        return d[1].links.some(value=>{return value.diff != 0})?'#dc3545':'green'
    })

    node.append('circle')
    .attr('class','inner')
    .attr('r',innerRadius)
    .each(function(d){console.log(d);})

    node.append('text')
    .text(function(d){return d[0]})
    .attr('dx', -intervel/2)
    .attr('dy', function(d,i){
        return i%2 == 0?radius+3*innerRadius:-radius-innerRadius
    })



}




  drawRv(clusterByKey){
    global.data.clusterByKey = clusterByKey

      
    const width = 1200,
    height = 600;

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
    overviewHieght = 130

    let nodes = [], links = []
    Object.values(clusterByKey).forEach(d=>{
        nodes = [...nodes, ...d.nodes]
    })

    Object.values(clusterByKey).forEach(d=>{
        links = [...links, ...d.links]
    })

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
      .force("charge", d3.forceManyBody().strength(-20))
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









    /* 开始画点和线 */
    let link = svg
      .append("g")
      .attr("class", "links")
      .selectAll("line")
      .data(links)
      .enter()
      .append("line")
      .style('stroke',function(d){
        return d.diff==0?"rgb(192, 189, 189)":'red'
      })

    let node = svg
      .append("g")
      .attr("class", "nodes")
      .selectAll('g')
      .data(nodes)
      .enter()
      .append('g')
      .on('mouseover',mouseover_circle)
      .on('mouseout',mouseout_circle)
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

      
      let hoverTrigger = node
      .append('circle')
      .attr('r',lightRadius)
    //   .each(function(d){console.log(d);})
      
      // .append("circle")
      // .attr("r", radius)

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
      .attr("viewBox", "0 -5 10 5")
      .attr("refX", 20)
      .attr("markerWidth", 4)
      .attr("markerHeight", 6)
      .attr("orient", "auto")
      .append("path")
      .attr("d", "M0,-5L10,0L0,5");

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

      // link.attr('d',function(d){
      //     return `M${d.source.x},${d.source.y} L${d.target.x},${d.target.y} Z`
      // })
      // .attr("marker-end", "url(#marker)")

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

      
      let [gX,gY] = d3.select(this).attr('transform').match(/(\d+\.?\d+)/g)

      d3.select('#tooltip')
          .transition()
          .delay(500)
          .style('opacity', 0.9);
      d3.select('#tooltip')
          .html(`<font color="#6610f2">_gvid:</font> ${d._gvid}</br><font color="#6610f2">id:</font>${d.id}</br><font color="#6610f2">label:</font> ${d.label}</br><font color="#6610f2">index:</font> ${d.index}`)
          .style('left', `${Number(gX)-radius+20}px`)
          .style("top", `${Number(gY)+rectHeightHover+paddingTop*2+overviewHieght}px`);
          

  }

  function mouseout_circle(d,i){
      let _this = this.parentNode;

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
      .duration(300)
      .style('opacity', 0);
  }
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
                    "index":undefined
                }
            })
    
    
    
            for(let i = 0;i<clusterArr.length;i++){
                clusterKey = clusterArr[i].id
                clusterByKey[clusterKey] = {};
                clusterByKey[clusterKey].nodes = [];
                clusterByKey[clusterKey].links = [];
                clusterArr[i].nodes.forEach(d=>{
                    clusterByKey[clusterKey].nodes.push(nodesByKey[d])
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
                            "goldenValue": goldenByKey[`${nodesByKey[edgesByKey[d].source].id}to${nodesByKey[edgesByKey[d].target].id}`].value,
                            "errValue": errByKey[`${nodesByKey[edgesByKey[d].source].id}to${nodesByKey[edgesByKey[d].target].id}`].value,
                            "diff": Math.abs(errByKey[`${nodesByKey[edgesByKey[d].source].id}to${nodesByKey[edgesByKey[d].target].id}`].value - goldenByKey[`${nodesByKey[edgesByKey[d].source].id}to${nodesByKey[edgesByKey[d].target].id}`].value),
                            "_gvid": edgesByKey[d]._gvid
                        })
                    })
                }
                clusterByKey[clusterKey].id = clusterArr[i].id;
                clusterByKey[clusterKey].label = clusterArr[i].label;
                clusterByKey[clusterKey].color = clusterArr[i].color;
            }
    
            
            /* 最终数组 */
            // json(clusterByKey)

            /* 引入drawOverview画上面的视图 */
            this.drawOvVw(clusterByKey)
      
            /* 引入drawRv画下面的视图 */
            this.drawRv(clusterByKey)
            
    })
    
  }


  

  componentDidMount() {
      
        /* 内部调用了draw函数 */
        this.initJson_parseLayout(this.initTxt_parseDiff());


  }

  render() {
    return (
      <div id="root">
          <div className='overview-container'>
              <svg id="svg-overview"></svg>
          </div>
        <div className="svg-container">
          <svg id="svg-rv"></svg>
        </div>
      </div>
    );
  }
}

export default DOM;
