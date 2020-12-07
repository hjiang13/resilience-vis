    clusterByKey = {}

    /* begin to parse the diff array according to golden arr and err arr */
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
                    goldenByKey[`${nodesByKey[edgesByKey[d].source].id}to${nodesByKey[edgesByKey[d].target].id}`].value,
                "errValue": 
                    errByKey[`${nodesByKey[edgesByKey[d].source].id}to${nodesByKey[edgesByKey[d].target].id}`].value,
                "diff": 
                    Math.abs(errByKey[`${nodesByKey[edgesByKey[d].source].id}to${nodesByKey[edgesByKey[d].target].id}`].value),
                "_gvid": edgesByKey[d]._gvid
            })
        })
    }

    /* output object */
    return clusterByKey;
    