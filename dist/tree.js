"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
var __spread = (this && this.__spread) || function () {
    for (var ar = [], i = 0; i < arguments.length; i++) ar = ar.concat(__read(arguments[i]));
    return ar;
};
var __values = (this && this.__values) || function(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m) return m.call(o);
    if (o && typeof o.length === "number") return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchFlatTree = exports.makeLeafArray = exports.makeForest = exports.FlatTree = void 0;
var utils = __importStar(require("./utils"));
var FlatTree = (function () {
    function FlatTree(hyperplanes, offsets, children, indices) {
        this.hyperplanes = hyperplanes;
        this.offsets = offsets;
        this.children = children;
        this.indices = indices;
    }
    return FlatTree;
}());
exports.FlatTree = FlatTree;
function makeForest(data, nNeighbors, nTrees, random) {
    var leafSize = Math.max(10, nNeighbors);
    var trees = utils
        .range(nTrees)
        .map(function (_, i) { return makeTree(data, leafSize, i, random); });
    var forest = trees.map(function (tree) { return flattenTree(tree, leafSize); });
    return forest;
}
exports.makeForest = makeForest;
function makeTree(data, leafSize, n, random) {
    if (leafSize === void 0) { leafSize = 30; }
    var indices = utils.range(data.length);
    var tree = makeEuclideanTree(data, indices, leafSize, n, random);
    return tree;
}
function makeEuclideanTree(data, indices, leafSize, q, random) {
    if (leafSize === void 0) { leafSize = 30; }
    var root = { isLeaf: false };
    var stack = [];
    stack.push({
        parentNode: null,
        isLeftChild: true,
        data: data,
        indices: indices,
        leafSize: leafSize,
        q: q,
        random: random,
    });
    while (stack.length > 0) {
        var work = stack.pop();
        var parentNode = work.parentNode, isLeftChild = work.isLeftChild, data_1 = work.data, indices_1 = work.indices, leafSize_1 = work.leafSize, q_1 = work.q, random_1 = work.random;
        var currentNode = parentNode === null
            ? root
            : isLeftChild
                ? parentNode.leftChild
                : parentNode.rightChild;
        if (indices_1.length <= leafSize_1) {
            currentNode.isLeaf = true;
            currentNode.indices = indices_1;
        }
        else {
            var splitResults = euclideanRandomProjectionSplit(data_1, indices_1, random_1);
            var indicesLeft = splitResults.indicesLeft, indicesRight = splitResults.indicesRight, hyperplane = splitResults.hyperplane, offset = splitResults.offset;
            currentNode.isLeaf = false;
            currentNode.hyperplane = hyperplane;
            currentNode.offset = offset;
            currentNode.leftChild = { isLeaf: false };
            currentNode.rightChild = { isLeaf: false };
            stack.push({
                parentNode: currentNode,
                isLeftChild: false,
                data: data_1,
                indices: indicesRight,
                leafSize: leafSize_1,
                q: q_1 + 1,
                random: random_1,
            });
            stack.push({
                parentNode: currentNode,
                isLeftChild: true,
                data: data_1,
                indices: indicesLeft,
                leafSize: leafSize_1,
                q: q_1 + 1,
                random: random_1,
            });
        }
    }
    return root;
}
function euclideanRandomProjectionSplit(data, indices, random) {
    var dim = data[0].length;
    var leftIndex = utils.tauRandInt(indices.length, random);
    var rightIndex = utils.tauRandInt(indices.length, random);
    rightIndex += leftIndex === rightIndex ? 1 : 0;
    rightIndex = rightIndex % indices.length;
    var left = indices[leftIndex];
    var right = indices[rightIndex];
    var hyperplaneOffset = 0;
    var hyperplaneVector = utils.zeros(dim);
    for (var i = 0; i < hyperplaneVector.length; i++) {
        hyperplaneVector[i] = data[left][i] - data[right][i];
        hyperplaneOffset -=
            (hyperplaneVector[i] * (data[left][i] + data[right][i])) / 2.0;
    }
    var nLeft = 0;
    var nRight = 0;
    var side = utils.zeros(indices.length);
    for (var i = 0; i < indices.length; i++) {
        var margin = hyperplaneOffset;
        for (var d = 0; d < dim; d++) {
            margin += hyperplaneVector[d] * data[indices[i]][d];
        }
        if (margin === 0) {
            side[i] = utils.tauRandInt(2, random);
            if (side[i] === 0) {
                nLeft += 1;
            }
            else {
                nRight += 1;
            }
        }
        else if (margin > 0) {
            side[i] = 0;
            nLeft += 1;
        }
        else {
            side[i] = 1;
            nRight += 1;
        }
    }
    var indicesLeft = utils.zeros(nLeft);
    var indicesRight = utils.zeros(nRight);
    nLeft = 0;
    nRight = 0;
    for (var i = 0; i < side.length; i++) {
        if (side[i] === 0) {
            indicesLeft[nLeft] = indices[i];
            nLeft += 1;
        }
        else {
            indicesRight[nRight] = indices[i];
            nRight += 1;
        }
    }
    return {
        indicesLeft: indicesLeft,
        indicesRight: indicesRight,
        hyperplane: hyperplaneVector,
        offset: hyperplaneOffset,
    };
}
function flattenTree(tree, leafSize) {
    var _a = countNodes(tree), nNodes = _a.nNodes, nLeaves = _a.nLeaves;
    var hyperplanes = utils
        .range(nNodes)
        .map(function () { return utils.zeros(tree.hyperplane ? tree.hyperplane.length : 0); });
    var offsets = utils.zeros(nNodes);
    var children = utils.range(nNodes).map(function () { return [-1, -1]; });
    var indices = utils
        .range(nLeaves)
        .map(function () { return utils.range(leafSize).map(function () { return -1; }); });
    nonRecursiveFlatten(tree, hyperplanes, offsets, children, indices, 0, 0);
    return new FlatTree(hyperplanes, offsets, children, indices);
}
function nonRecursiveFlatten(tree, hyperplanes, offsets, children, indices, initNodeNum, initLeafNum) {
    var _a;
    var stack = [
        {
            node: tree,
            nodeNum: initNodeNum,
            leafNum: initLeafNum,
            oldNodeNum: initNodeNum,
            state: 0,
            parent: null,
        },
    ];
    console.log('call', {
        tree: tree,
        nodeNum: initNodeNum,
        leafNum: initLeafNum,
    });
    function getCurrentEntry() {
        return stack[stack.length - 1];
    }
    function makeCall(node, nodeNum, leafNum) {
        console.log('call', { tree: node, nodeNum: nodeNum, leafNum: leafNum });
        var entry = getCurrentEntry();
        stack.push({
            node: node,
            nodeNum: nodeNum,
            oldNodeNum: nodeNum,
            leafNum: leafNum,
            parent: entry,
            state: 0,
        });
    }
    function returnCall(leafNum, nodeNum) {
        console.log('return', { nodeNum: nodeNum, leafNum: leafNum });
        var parent = getCurrentEntry().parent;
        if (!parent) {
            throw new Error('returning from call without parent');
        }
        parent.leafNum = leafNum;
        parent.nodeNum = nodeNum;
        parent.state += 1;
        stack.pop();
    }
    while (true) {
        var _b = getCurrentEntry(), node = _b.node, nodeNum = _b.nodeNum, oldNodeNum = _b.oldNodeNum, leafNum = _b.leafNum, state = _b.state, parent_1 = _b.parent;
        switch (state) {
            case 0: {
                if (node.isLeaf) {
                    children[nodeNum][0] = -leafNum;
                    (_a = indices[leafNum]).splice.apply(_a, __spread([0, node.indices.length], node.indices));
                    returnCall(leafNum + 1, nodeNum);
                    continue;
                }
                hyperplanes[nodeNum] = node.hyperplane;
                offsets[nodeNum] = node.offset;
                children[nodeNum][0] = nodeNum + 1;
                makeCall(node.leftChild, nodeNum + 1, leafNum);
                continue;
            }
            case 1: {
                children[oldNodeNum][1] = nodeNum + 1;
                makeCall(node.rightChild, nodeNum + 1, leafNum);
                continue;
            }
            case 2: {
                if (parent_1) {
                    returnCall(leafNum, nodeNum);
                    continue;
                }
                else {
                    return { nodeNum: nodeNum, leafNum: leafNum };
                }
            }
        }
    }
}
function recursiveFlatten(tree, hyperplanes, offsets, children, indices, nodeNum, leafNum) {
    var _a;
    console.log('call', { tree: tree, nodeNum: nodeNum, leafNum: leafNum });
    if (tree.isLeaf) {
        children[nodeNum][0] = -leafNum;
        (_a = indices[leafNum]).splice.apply(_a, __spread([0, tree.indices.length], tree.indices));
        leafNum += 1;
        console.log('return', { nodeNum: nodeNum, leafNum: leafNum });
        return { nodeNum: nodeNum, leafNum: leafNum };
    }
    else {
        hyperplanes[nodeNum] = tree.hyperplane;
        offsets[nodeNum] = tree.offset;
        children[nodeNum][0] = nodeNum + 1;
        var oldNodeNum = nodeNum;
        var res = recursiveFlatten(tree.leftChild, hyperplanes, offsets, children, indices, nodeNum + 1, leafNum);
        nodeNum = res.nodeNum;
        leafNum = res.leafNum;
        children[oldNodeNum][1] = nodeNum + 1;
        res = recursiveFlatten(tree.rightChild, hyperplanes, offsets, children, indices, nodeNum + 1, leafNum);
        console.log('return', { nodeNum: res.nodeNum, leafNum: res.leafNum });
        return { nodeNum: res.nodeNum, leafNum: res.leafNum };
    }
}
function countNodes(tree) {
    var nNodes = 0;
    var nLeaves = 0;
    var stack = [tree];
    while (true) {
        var node = stack.pop();
        if (node === undefined) {
            return { nNodes: nNodes, nLeaves: nLeaves };
        }
        nNodes++;
        if (node.isLeaf) {
            nLeaves++;
        }
        else {
            stack.push(node.leftChild, node.rightChild);
        }
    }
}
function numNodes(tree) {
    if (tree.isLeaf) {
        return 1;
    }
    else {
        return 1 + numNodes(tree.leftChild) + numNodes(tree.rightChild);
    }
}
function numLeaves(tree) {
    if (tree.isLeaf) {
        return 1;
    }
    else {
        return numLeaves(tree.leftChild) + numLeaves(tree.rightChild);
    }
}
function makeLeafArray(rpForest) {
    var e_1, _a;
    if (rpForest.length > 0) {
        var output = [];
        try {
            for (var rpForest_1 = __values(rpForest), rpForest_1_1 = rpForest_1.next(); !rpForest_1_1.done; rpForest_1_1 = rpForest_1.next()) {
                var tree = rpForest_1_1.value;
                output.push.apply(output, __spread(tree.indices));
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (rpForest_1_1 && !rpForest_1_1.done && (_a = rpForest_1.return)) _a.call(rpForest_1);
            }
            finally { if (e_1) throw e_1.error; }
        }
        return output;
    }
    else {
        return [[-1]];
    }
}
exports.makeLeafArray = makeLeafArray;
function selectSide(hyperplane, offset, point, random) {
    var margin = offset;
    for (var d = 0; d < point.length; d++) {
        margin += hyperplane[d] * point[d];
    }
    if (margin === 0) {
        var side = utils.tauRandInt(2, random);
        return side;
    }
    else if (margin > 0) {
        return 0;
    }
    else {
        return 1;
    }
}
function searchFlatTree(point, tree, random) {
    var node = 0;
    while (tree.children[node][0] > 0) {
        var side = selectSide(tree.hyperplanes[node], tree.offsets[node], point, random);
        if (side === 0) {
            node = tree.children[node][0];
        }
        else {
            node = tree.children[node][1];
        }
    }
    var index = -1 * tree.children[node][0];
    return tree.indices[index];
}
exports.searchFlatTree = searchFlatTree;
