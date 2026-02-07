import React, { useEffect, useRef, useState, useCallback } from 'react';
import cytoscape from 'cytoscape';
import fcose from 'cytoscape-fcose';
import avsdf from 'cytoscape-avsdf';
import popper from 'cytoscape-popper';
import tippy from 'tippy.js';
import 'tippy.js/dist/tippy.css';
import 'tippy.js/themes/light.css';
import seedrandom from 'seedrandom';
import { Character, Language, LayoutName, Stats } from '../types';

// Register extensions
cytoscape.use(fcose);
cytoscape.use(avsdf);
cytoscape.use(popper);

// Helper functions (math)
function gcd(a: number, b: number): number {
  if (!b) return a;
  return gcd(b, a % b);
}

function lcm(a: number, b: number): number {
  return (a * b) / gcd(a, b);
}

function rotate(pos: { x: number; y: number }, center: { x: number; y: number }, angle: number) {
  let dx = pos.x - center.x;
  let dy = pos.y - center.y;
  let r = Math.sqrt(dx ** 2 + dy ** 2);
  let theta = Math.atan2(dy, dx) + angle;
  let newX = center.x + r * Math.cos(theta);
  let newY = center.y + r * Math.sin(theta);
  return { x: newX, y: newY };
}

interface GraphProps {
  language: Language;
  layoutName: LayoutName;
  onLayoutChange: (name: LayoutName) => void;
  onStatsUpdate: (totalNodes: number, avgConnections: number) => void;
  resetTrigger: number;
}

const Graph: React.FC<GraphProps> = ({
  language,
  layoutName,
  onLayoutChange,
  onStatsUpdate,
  resetTrigger,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<cytoscape.Core | null>(null);
  const [dataLoaded, setDataLoaded] = useState(false);
  
  // State refs to access inside callbacks without re-creating them
  const layoutNameRef = useRef(layoutName);
  const languageRef = useRef(language);
  const centeredNodeRef = useRef<cytoscape.NodeSingular | null>(null);
  const centeredNodePrevPositionRef = useRef<cytoscape.Position | null>(null);
  const randomSeed = 1;

  useEffect(() => {
    layoutNameRef.current = layoutName;
  }, [layoutName]);

  useEffect(() => {
    languageRef.current = language;
  }, [language]);

  // Styles
  const cyStyles: any[] = [
    {
      selector: 'node',
      style: {
        width: '80px',
        height: '80px',
        'background-fit': 'contain',
        'background-color': 'hsl(0, 0%, 90%)',
      },
    },
    {
      selector: 'edge',
      style: {
        width: 3,
        'line-color': 'hsl(0, 0%, 75%)',
        opacity: 0.25,
      },
    },
    {
      selector: '.selectedNode',
      style: {
        'border-width': 2,
        'border-color': '#000',
        'border-style': 'solid',
        width: '95px',
        height: '95px',
        'z-index': 10,
      },
    },
    {
      selector: '.connectedEdges',
      style: {
        'line-color': 'hsl(0, 0%, 45%)',
        width: 4,
        opacity: 0.6,
        'z-index': 9,
      },
    },
    {
      selector: '.inOnly',
      style: {
        'line-style': 'dashed',
        'line-dash-pattern': [10, 10],
      },
    },
    {
      selector: '.outOnly',
      style: {
        'line-style': 'dashed',
        'line-dash-pattern': [6, 4],
      },
    },
    {
      selector: '.unconnectedEdges',
      style: {
        'line-color': 'hsl(0, 0%, 85%)',
        width: 2,
        opacity: 0.1,
        'z-index': 0,
      },
    },
    {
      selector: '.connectedNodes',
      style: {
        'z-index': 10,
        'border-width': 1,
        'border-color': '#666',
      }
    }
  ];

  // Logic functions
  const moveNodeTo = useCallback((node: cytoscape.NodeSingular, pos: cytoscape.Position | "center" = "center") => {
    let destination: cytoscape.Position;
    if (pos === "center") {
      if (!cyRef.current) return;
      let box = cyRef.current.extent();
      destination = { x: (box.x1 + box.x2) / 2, y: (box.y1 + box.y2) / 2 };
    } else {
      destination = pos;
    }

    node.animate({
      position: destination,
      // queue: false,
      duration: 600,
      easing: "ease-in-out",
    });
  }, []);

  const rotateCircles = useCallback(() => {
    const cy = cyRef.current;
    if (!cy) return;
    const selectedNode = cy.$(".selectedNode");
    if (selectedNode.length === 0) return;

    let levelFolds: Record<number, number> = {};
    for (let n of cy.$("node")) {
      // ignore 0 connection ones
      let l = selectedNode.edgesWith(n).length;
      if (l > 0) {
        if (!levelFolds[l]) {
          levelFolds[l] = 1;
        } else {
          levelFolds[l] += 1;
        }
      }
    }

    let folds = Object.values(levelFolds)
      .map((x) => Number(x))
      .sort((a, b) => a - b);
    let maxFold = folds[folds.length - 1];
    let maxFold2 = folds[folds.length - 2];
    let levelRef = Object.keys(levelFolds).find(
      (k) => levelFolds[Number(k)] === maxFold
    );

    for (let n of cy.nodes()) {
      let l = selectedNode.edgesWith(n).length;
      let currentFold = levelFolds[l];
      if (l !== Number(levelRef) && l > 0) {
        let angle = 0;
        if (folds.indexOf(currentFold) === folds.length - 2) {
          angle = Math.PI / lcm(currentFold, maxFold);
        } else if (folds.indexOf(currentFold) === folds.length - 3) {
          if (maxFold === maxFold2) {
            angle = (0.5 * Math.PI) / maxFold;
          } else {
            angle = -Math.PI / maxFold;
          }
        } else {
          angle = (-Math.random() * Math.PI) / maxFold;
        }

        n.animate({
          position: rotate(n.position(), selectedNode.position(), angle),
          // queue: false,
          duration: 600,
          easing: "ease-in-out",
        });
      }
    }
  }, []);

  const getLayout = useCallback((name: string) => {
    const cy = cyRef.current;
    if (!cy) return null;

    let layoutOptions: any = {
      name: name,
      animate: "end",
      animationEasing: "ease-in-out",
      animationDuration: 700,
      stop: function () {
        // Callback after layout
      },
    };

    let extraOptions = {};
    if (name === "fcose") {
      extraOptions = {
        nodeSeparation: 150,
        nodeRepulsion: (node: any) => 100000,
        idealEdgeLength: (edge: any) => 80,
        edgeElasticity: (edge: any) => 0.03,
        ready: () => {
          if (cy.$(".selectedNodeTemp").length > 0) {
            cy.$(".selectedNodeTemp").addClass("selectedNode");
            cy.$(".selectedNodeTemp").removeClass("selectedNodeTemp");
          }
        },
      };
    }
    if (name === "avsdf") {
      extraOptions = {
        nodeSeparation: 95,
        stop: function () {
          if (cy.$(".selectedNode").length > 0) {
            centeredNodeRef.current = cy.$(".selectedNode");
            centeredNodePrevPositionRef.current = Object.assign(
              {},
              cy.$(".selectedNode").position()
            );
            moveNodeTo(cy.$(".selectedNode"), "center");
          }
        },
      };
    }
    if (name === "concentric") {
      extraOptions = {
        levelWidth: (n: any) => 1,
        concentric: function (node: any) {
          let d = node.degree();
          let n = 1;
          if (d >= 13) n += 1;
          if (d >= 16) n += 1;
          if (d >= 18) n += 1;
          if (d >= 21) n += 1;
          return n;
        },
      };
    }
    if (name === "concentricCustom") {
      extraOptions = {
        name: "concentric",
        concentric: function (node: any) {
          let selectedNode = cy.$(".selectedNode");
          if (selectedNode.id() === node.id()) {
            return 9;
          } else {
            let l = selectedNode.edgesWith(node).length;
            return l;
          }
        },
        levelWidth: (_n: any) => 1,
        startAngle: 1.5 * Math.PI,
        stop: function () {
          rotateCircles();
        },
      };
    }

    return cy.layout({ ...layoutOptions, ...extraOptions });
  }, [moveNodeTo, rotateCircles]);

  const runLayout = useCallback((name: string, overwrite = false) => {
    const cy = cyRef.current;
    if (!cy) return;

    let targetName = name;
    if (name === "concentric" && cy.$(".selectedNode").length > 0) {
      targetName = "concentricCustom";
    }

    if (targetName === "fcose") {
      if (cy.$(".selectedNode").length > 0) {
        cy.$(".selectedNode").addClass("selectedNodeTemp");
        cy.$(".selectedNode").removeClass("selectedNode");
      }
      seedrandom(randomSeed.toString(), { global: true });
    }

    if (centeredNodePrevPositionRef.current) {
      centeredNodePrevPositionRef.current = null;
      centeredNodeRef.current = null;
    }

    const layout = getLayout(targetName);
    if (layout) layout.run();
  }, [getLayout]);

  const updateStats = useCallback(() => {
    const cy = cyRef.current;
    if (!cy) return;
    let totalNodes = cy.nodes().length;
    let stats: Stats[] = [];
    cy.nodes().forEach(function (ele) {
      let nodesIn = ele.incomers().filter((ele) => ele.isNode());
      let nodesOut = ele.outgoers().filter((ele) => ele.isNode());
      let edgesIn = ele.incomers().filter((ele) => ele.isEdge());
      let edgesOut = ele.outgoers().filter((ele) => ele.isEdge());
      stats.push({
        id: ele.id(),
        nodesIn: nodesIn.length,
        nodesOut: nodesOut.length,
        edgesIn: edgesIn.length,
        edgesOut: edgesOut.length,
        nodesConnected: nodesIn.union(nodesOut).length,
      });
    });
    let totalConnectios = stats.reduce((acc, cur) => acc + cur.nodesConnected, 0);
    let avgConnections = Math.round((10 * totalConnectios) / totalNodes) / 10;
    
    onStatsUpdate(totalNodes, avgConnections);
  }, [onStatsUpdate]);

  const unselectElements = useCallback(() => {
    const cy = cyRef.current;
    if (!cy) return;
    cy.$("node").removeClass(["selectedNode", "connectedNodes"]);
    cy.$("edge").removeClass([
      "unconnectedEdges",
      "connectedEdges",
      "inOnly",
      "outOnly",
    ]);
  }, []);

  const selectNode = useCallback((target: cytoscape.NodeSingular) => {
    const cy = cyRef.current;
    if (!cy) return;
    
    cy.edges().not(target.connectedEdges()).addClass("unconnectedEdges");
    target.addClass("selectedNode");
    const neighbors = target.neighborhood("node");
    neighbors.addClass("connectedNodes");

    neighbors.forEach((n) => {
      const edgesIn = n.edgesTo(target);
      const edgesOut = target.edgesTo(n);
      edgesIn.addClass("connectedEdges");
      edgesOut.addClass("connectedEdges");
      if (edgesIn.length > 0 && edgesOut.length === 0) {
        edgesIn.addClass("inOnly");
      }
      if (edgesOut.length > 0 && edgesIn.length === 0) {
        edgesOut.addClass("outOnly");
      }
    });
  }, []);

  // Initialize Cytoscape
  useEffect(() => {
    if (!containerRef.current) return;
    if (cyRef.current) return;

    cyRef.current = cytoscape({
      container: containerRef.current,
      elements: [],
      boxSelectionEnabled: false,
      minZoom: 0.1,
      maxZoom: 2.5,
      style: cyStyles,
    });

    const cy = cyRef.current;

    // Event handlers
    cy.on("tap", "node", function (event) {
      var target = event.target;
      if (!target.hasClass("selectedNode")) {
        if (layoutNameRef.current === "avsdf") {
          if (centeredNodeRef.current !== target) {
            if (centeredNodeRef.current) {
              moveNodeTo(centeredNodeRef.current, centeredNodePrevPositionRef.current || undefined);
            }
            centeredNodeRef.current = target;
            centeredNodePrevPositionRef.current = Object.assign({}, target.position());
            moveNodeTo(target, "center");
          }
        }
        unselectElements();
        selectNode(target);
        if (layoutNameRef.current === "concentric") {
          // Trigger layout change via prop if needed, but here we can just run it
          // Wait, if we change prop, it will trigger useEffect. 
          // But concentricCustom is internal logic for concentric layout when node is selected.
          // So we should probably just run it.
          onLayoutChange('concentricCustom'); 
          // Actually onLayoutChange will trigger parent state change -> prop change -> useEffect -> runLayout
          // So we should call onLayoutChange('concentric') which might be same, 
          // or we handle concentricCustom internally in runLayout logic which checks for selection.
          // In original code: if (getSelectedOption() === "concentric") { setLayout("concentricCustom") }
          // So we should just call runLayout("concentricCustom") directly or via prop.
          // If we use prop, the radio button needs to support it? No.
          // Let's just run it directly.
          
          // Actually, better to just run the layout logic here since it's an interaction effect
          const layout = getLayout("concentricCustom");
          if(layout) layout.run();
        }
      }
    });

    cy.on("tap", function (ev: any) {
      if (ev.target === cy) {
        unselectElements();
      }
    });

    // Tooltip logic
    const makeTippyContent = (node1: cytoscape.NodeSingular, node2: cytoscape.NodeSingular) => {
        let text = "";
        const lang = languageRef.current;
        const edgesTo = node1.edgesTo(node2);
        for (let i = 0; i < edgesTo.length; i++) {
            const edge = edgesTo[i];
            text += `<div class="font-bold text-sm mb-1">${edge.data()["title_" + lang]}</div>`;
            text += `<div class="font-serif text-base mb-2 italic">${edge.data()["content_" + lang]}</div>`;
        }
        
        const edgesFrom = node2.edgesTo(node1);
        if (text && edgesFrom.length > 0) text += '<div class="h-2"></div>';
        
        for (let i = 0; i < edgesFrom.length; i++) {
            const edge = edgesFrom[i];
            text += `<div class="font-bold text-sm mb-1">${edge.data()["title_" + lang]}</div>`;
            text += `<div class="font-serif text-base mb-2 italic">${edge.data()["content_" + lang]}</div>`;
        }
        return text;
    };

    const makePopup = (target: any, text: string, delay = 200) => {
        const ref = target.popperRef();
        const dummyDomEle = document.createElement("div");

        const tip = tippy(dummyDomEle, {
            getReferenceClientRect: ref.getBoundingClientRect,
            trigger: "manual",
            content: () => {
                const div = document.createElement("div");
                div.innerHTML = text;
                div.className = "text-left max-w-xs max-h-64 overflow-y-auto";
                return div;
            },
            onHidden(instance) {
                instance.destroy();
            },
            theme: "light",
            arrow: true,
            placement: "auto",
            hideOnClick: true,
            interactive: true,
            appendTo: document.body,
        });

        target.tippy = tip;
        target.showTimer = setTimeout(function () {
            target.tippy.show();
            // cy.userZoomingEnabled(false); // Can be annoying
            // cy.userPanningEnabled(false);
        }, delay);

        target.once("mouseout", () => {
            if (target.tippy) {
                target.tippy.hide();
            }
            clearTimeout(target.showTimer);
            // cy.userZoomingEnabled(true);
            // cy.userPanningEnabled(true);
        });
    };

    cy.on("mouseover", "edge", function (event) {
        let targetEdge = event.target;
        if (targetEdge.hasClass("connectedEdges")) {
            let node1 = cy.$(".selectedNode");
            if (node1.length === 0) return;
            let node2 = targetEdge.source().id() === node1.id() ? targetEdge.target() : targetEdge.source();
            let text = makeTippyContent(node1, node2);
            makePopup(targetEdge, text);
        }
    });

    cy.on("mouseover", "node", function (event) {
        let target = event.target;
        if (target.hasClass("connectedNodes")) {
            let selectedNode = cy.$(".selectedNode");
            if (selectedNode.length === 0) return;
            let text = makeTippyContent(selectedNode, target);
            makePopup(target, text, 500);
        }
    });

    // Load data
    fetch('data/char_data.json')
      .then(res => res.json())
      .then((data: Character[]) => {
        const nodes: any[] = [];
        const edges: any[] = [];

        data.forEach(char => {
          nodes.push({
            group: "nodes",
            data: { id: char.name_en, name_en: char.name_en, name_zh: char.name_zh },
            style: {
              "background-image": `data/image/${char.name_zh}.png`,
            }
          });
        });

        data.forEach(sourceChar => {
          sourceChar.lines.forEach((line, index) => {
            edges.push({
              group: "edges",
              data: {
                id: `${sourceChar.name_en}_${index}`,
                source: sourceChar.name_en,
                target: line.target_en,
                ...line,
              }
            });
          });
        });

        cy.add([...nodes, ...edges]);
        
        // Remove unconnected nodes
        cy.nodes().forEach((n: any) => {
            if (n.degree(false) === 0) n.remove();
        });

        cy.edges().unpanify();
        cy.edges().unselectify();

        updateStats();
        setDataLoaded(true);
      });

      return () => {
          cy.destroy();
          cyRef.current = null;
      };
  }, []); // Init once

  // Handle layout changes
  useEffect(() => {
    if (dataLoaded) {
      runLayout(layoutName);
    }
  }, [layoutName, dataLoaded, runLayout]);

  // Handle reset
  useEffect(() => {
      if (dataLoaded && resetTrigger > 0) {
          unselectElements();
          runLayout(layoutNameRef.current, true);
      }
  }, [resetTrigger, dataLoaded, unselectElements, runLayout]);

  return <div ref={containerRef} className="w-full h-full bg-slate-100" />;
};

export default Graph;
