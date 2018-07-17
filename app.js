const clusterMaker = require('./kmeans');

const baseClusters = require('./baseclusters.json');

const DOT_DIAMETER = 8;

const MAX_ITERS = 300;

const COLORS = ["red","orange","yellow","green","blue","indigo","violet","cyan","grey","lime"];

const ANIMATION_SECONDS = 5;

var canvas = document.getElementById("canvas");

var numCentroids = document.getElementById("num-centroids").value;

var vectors = [];

(function() {
    // create dropdown from which default clusters can be selected
    var select = document.getElementById('select-cluster');
    var options = ["-"].concat(Object.keys(baseClusters[0]));
    options.forEach(function(key){
        option = document.createElement("option");
        option.text = key;
        select.add(option);
    })
    // choose default base clusters, get clusters, and draw unlabeled vectors
    select.selectedIndex = 1;
    vectors = getBaseClusters(select.value);
    drawBaseVectors()

    select.addEventListener('input', function(){
        // set vectors list to one of the baselines when option is selected from menu
        vectors = select.value != "-" ? getBaseClusters(select.value) : [];
        drawBaseVectors();
    });

    $('#canvas').mousedown(function(e){
        // draw vector on canvas click
        var rect = e.target.getBoundingClientRect();
        var x = e.clientX - rect.left;
        var y = e.clientY - rect.top;
        var context = canvas.getContext("2d");
        vectors.push([x, y]);
        drawVector(context, "black", x, y);
    });

    $('#clear').click(function(e){
        // clear canvas and delete vectors
        canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
        vectors = [];
        select.selectedIndex = 0;
    });

    $('#visualize').click(function(e){
        // if any vectors, cluster using k-means and then start the animation
        if(vectors.length > 0) 
            var clusterTimeSteps = getClusterTimeSteps();
            initAnimate(clusterTimeSteps);
    });

    $('#num-centroids').on('change', function(){
        // modify numCentroids variable based on input
        if(this.value > 10 || this.value < 1)
            alert("Please input Num Centroids between 1 and 10");
        else
            numCentroids = this.value;
    });
})();

function initAnimate(clusterTimeSteps){
    // animate the k-means alg
    var timePerClusterStep = (ANIMATION_SECONDS * 1000) / clusterTimeSteps.length;
    var start = null;
    function animate(timestamp){
        // single timestep of animation
        if (!start) start = timestamp;
        var msPassed = timestamp - start;
        var currentClusterStep = Math.floor( (clusterTimeSteps.length * msPassed) / (ANIMATION_SECONDS * 1000) );
        if(currentClusterStep < clusterTimeSteps.length - 1){
            canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
            var percent = (msPassed / timePerClusterStep) - currentClusterStep;
            var currentClusters = clusterTimeSteps[currentClusterStep];
            var nextClusters = clusterTimeSteps[currentClusterStep + 1];
            canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
            currentClusters.forEach(function(cluster, i){
                var color = COLORS[i];
                cluster.points.forEach(function(point){ drawVector(canvas.getContext("2d"), color, point[0], point[1]); });
                var centroidProgress = calcPosOnLine(cluster.centroid[0], cluster.centroid[1], nextClusters[i].centroid[0], nextClusters[i].centroid[1], percent);
                drawCentroid(canvas.getContext("2d"), color, centroidProgress[0], centroidProgress[1]);
            });
            window.requestAnimationFrame(animate);
        }
    }
    window.requestAnimationFrame(animate);
    canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
    clusterTimeSteps[clusterTimeSteps.length - 1].forEach(function(cluster, i){
        var color = COLORS[i];
        cluster.points.forEach(function(point){ drawVector(canvas.getContext("2d"), color, point[0], point[1]); });
        drawCentroid(canvas.getContext("2d"), color, cluster.centroid[0], cluster.centroid[1]);
    });
}

function calcPosOnLine(xStart, yStart, xDest, yDest, percent){
    // get position on a line as percentage of the way from start to dest
    return [xStart + (xDest - xStart) * percent, yStart + (yDest - yStart) * percent]
}

function getClusterTimeSteps(){
    // get clusters using k-means alg
    clusterMaker.k(numCentroids);
    clusterMaker.iterations(MAX_ITERS);
    clusterMaker.data(vectors);
    var res = clusterMaker.clusters();
    return res;
}

function drawBaseVectors(){
    // draw non-labeled clusters
    var context = canvas.getContext("2d");
    context.clearRect(0, 0, canvas.width, canvas.height);
    vectors.forEach(function(vector){
        drawVector(context, "black", vector[0], vector[1]);
    });
}

function getBaseClusters(key){
    // return deep copy of base clusters
    return jQuery.extend(true, [], baseClusters[0][key]);
}

function drawVector(context, color, x, y){
    context.strokeStyle = color;
    context.lineJoin = "round";
    context.lineWidth = DOT_DIAMETER;
    context.beginPath();
    context.moveTo(x + 0.1, y);
    context.lineTo(x, y);
    context.closePath();
    context.stroke();
}

function drawCentroid(context, color, x, y){
    var sideLen = DOT_DIAMETER * 1.5;
    context.fillStyle = color;
    context.fillRect(x - sideLen/2, y - sideLen/2, sideLen, sideLen);
    context.strokeStyle = 'black';
    context.lineWidth = 1;
    context.rect(x - sideLen/2, y - sideLen/2, sideLen, sideLen);
    context.closePath();
    context.stroke();
}