package SysML_v2_Parallel_Editor_Architecture {
    
    doc /* Final Systems Engineering Specification for the Parallel Model Engine 
           incorporating non-destructive text synchronization and safe DOM rendering. */

    /* ==========================================================
       1. CORE TYPE DEFINITIONS & INTERFACES
       ========================================================== */
    attribute def BoundaryEdge;
    attribute def ViewContext;
    
    port def StructuralPort {
        attribute id: ScalarValues::String;
        attribute blockId: ScalarValues::String;
        attribute pctX: ScalarValues::Real; 
        attribute pctY: ScalarValues::Real; 
        attribute edge: BoundaryEdge;
        attribute isSelected: ScalarValues::Boolean;
    }

    abstract part def ModelElement {
        attribute id: ScalarValues::String;
        attribute text: ScalarValues::String;
    }

    /* ==========================================================
       2. GRAPHICAL CONNECTIVITY LAYER
       ========================================================== */
    part def CanvasConnector {
        attribute id: ScalarValues::String;
        attribute fromPortId: ScalarValues::String;
        attribute toPortId: ScalarValues::String;
        
        part def SVGPath {
            attribute pathDataCommand: ScalarValues::String; // 'M... C...' Bézier layout
            attribute hitBoxStrokeWidth: ScalarValues::Integer = 14;
            attribute visibleStrokeWidth: ScalarValues::Integer = 2;
        }
        part visualPath: SVGPath[1];
    }

    /* ==========================================================
       3. WORKSPACE VIEW DEFINITIONS (Definition vs Usage)
       ========================================================== */
    
    // The DefinitionView blueprint (manages part definitions)
    part def DefinitionViewSpecification {
        attribute blockCounter: ScalarValues::Integer = 0;
        attribute portCounter: ScalarValues::Integer = 0;
        attribute connCounter: ScalarValues::Integer = 0;
        
        part partDefs: PartDefinitionNode[0..*];
        part definitionConnections: CanvasConnector[0..*];
    }

    // The UsageView blueprint (manages nested system assembly part usage)
    part def UsageViewSpecification {
        attribute blockCounter: ScalarValues::Integer = 0;
        attribute portCounter: ScalarValues::Integer = 0;
        attribute connCounter: ScalarValues::Integer = 0;
        attribute parentDefinitionId: ScalarValues::String; // Strict traceback invariant

        part partUsages: PartUsageNode[0..*];
        part usageConnectors: CanvasConnector[0..*];
    }

    // Node layout details
    part def PartDefinitionNode :> ModelElement {
        attribute stereotype: ScalarValues::String = "«part def»";
        attribute left: ScalarValues::String;
        attribute top: ScalarValues::String;
        attribute width: ScalarValues::String = "130px";
        attribute height: ScalarValues::String = "80px";
        
        port boundaryPorts: StructuralPort[0..*];
    }

    part def PartUsageNode :> ModelElement {
        attribute stereotype: ScalarValues::String = "«part»";
        attribute left: ScalarValues::String;
        attribute top: ScalarValues::String;
        attribute width: ScalarValues::String;
        attribute height: ScalarValues::String;
        
        port boundaryPorts: StructuralPort[0..*];
    }

    /* ==========================================================
       4. SYSTEM SUBSYSTEMS & RUNTIME ACTIONS
       ========================================================== */
    
    part def ScriptSyncCompiler {
        attribute targetRegexPattern: ScalarValues::String = "part\\s+def\\s+([A-Za-z0-9_]+)";
        
        // Fix #2: Multi-step non-destructive state synchronization pipeline
        action compileSysMLV2Text {
            in scriptBuffer: ScalarValues::String;
            
            action parseIdentifiers;
            action pruneStaleDefinitions; // Drops nodes omitted in script text along with their relationships
            action injectUniqueDefinitions; // Spaces out missing definitions along layout matrix rules
            action renderSynchronizedCanvas;
            
            first parseIdentifiers
                then pruneStaleDefinitions
                then injectUniqueDefinitions
                then renderSynchronizedCanvas;
        }
    }

    part def DOMRenderingEngine {
        // Fix #1: DOM child tree validation routine
        action renderActiveView {
            action queryActiveNodes;
            action verifyChildPresence; // Prevents DOM 'NotFoundError' crashes by asserting canvas ownership
            action safeRemoveNodes;
            action generateDynamicElements;
            
            first queryActiveNodes
                then verifyChildPresence
                then safeRemoveNodes
                then generateDynamicElements;
        }
    }

    part def UnifiedPointerController {
        attribute isDragging: ScalarValues::Boolean = false;
        attribute dragTargetId: ScalarValues::String;
        attribute overlapRadiusThreshold: ScalarValues::Integer = 16;

        action onPointerStart;
        action onPointerMove;
        action onPointerEnd;
    }

    part def LocalStoragePersistence {
        attribute storageKey: ScalarValues::String = "sysml_v2_parallel_modelling_state";
        
        action checkpointState;
        action writeToDisk;
        action readFromDisk;
    }

    /* ==========================================================
       5. COMPOSITION CONTEXT (System Deployment Instance)
       ========================================================== */
    
    // Root Modeler Application Instance
    part parallelModelerEngine {
        attribute runtimeView: ViewContext = ViewContext::DefinitionView;
        
        // Subsystem Instantiations
        part definitionWorkspace: DefinitionViewSpecification[1];
        part usageWorkspaces: UsageViewSpecification[0..*];
        
        part compilerSubsystem: ScriptSyncCompiler[1];
        part rendererSubsystem: DOMRenderingEngine[1];
        part interactionSubsystem: UnifiedPointerController[1];
        part persistenceSubsystem: LocalStoragePersistence[1];
    }
}