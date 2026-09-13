import type { PropertyDef as $PropertyDef } from '@osdk/client';
import { $osdkMetadata } from '../../OntologyMetadata.js';
import type { InventoryLot } from './InventoryLot.js';
import type { Supplier } from './Supplier.js';
import type { BomLine } from './BomLine.js';
import type { Shortage } from './Shortage.js';
import type { ObjectTypeDefinition as $ObjectTypeDefinition, ObjectMetadata as $ObjectMetadata } from '@osdk/client';
import type { ObjectSet as $ObjectSet, Osdk as $Osdk, PropertyValueWireToClient as $PropType, SingleLinkAccessor as $SingleLinkAccessor } from '@osdk/client';
export declare namespace Part {
    type PropertyKeys = 'criticality' | 'description' | 'leadTimeDays' | 'partNumber' | 'supplierId' | 'unitCostUsd' | 'uom';
    interface Links {
        readonly bomLines: BomLine.ObjectSet;
        readonly inventoryLots: InventoryLot.ObjectSet;
        readonly shortages: Shortage.ObjectSet;
        readonly supplier: $SingleLinkAccessor<Supplier>;
    }
    interface Props {
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'Criticality'
         */
        readonly criticality: $PropType['string'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'Description'
         */
        readonly description: $PropType['string'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'Lead Time Days'
         */
        readonly leadTimeDays: $PropType['integer'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'Part Number'
         */
        readonly partNumber: $PropType['string'];
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'Supplier Id'
         */
        readonly supplierId: $PropType['string'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'Unit Cost Usd'
         */
        readonly unitCostUsd: $PropType['double'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'Uom'
         */
        readonly uom: $PropType['string'] | undefined;
    }
    type StrictProps = Props;
    interface ObjectSet extends $ObjectSet<Part, Part.ObjectSet> {
    }
    type OsdkInstance<OPTIONS extends never | '$rid' = never, K extends keyof Part.Props = keyof Part.Props> = $Osdk.Instance<Part, OPTIONS, K>;
    /** @deprecated use OsdkInstance */
    type OsdkObject<OPTIONS extends never | '$rid' = never, K extends keyof Part.Props = keyof Part.Props> = OsdkInstance<OPTIONS, K>;
}
export interface Part extends $ObjectTypeDefinition {
    osdkMetadata: typeof $osdkMetadata;
    type: 'object';
    apiName: 'Part';
    primaryKeyApiName: 'partNumber';
    primaryKeyType: 'string';
    __DefinitionMetadata?: {
        objectSet: Part.ObjectSet;
        props: Part.Props;
        linksType: Part.Links;
        strictProps: Part.StrictProps;
        apiName: 'Part';
        description: 'A purchased part. Criticality and lead time determine how badly a shortage hurts.';
        displayName: 'Part';
        icon: {
            type: 'blueprint';
            color: '#4C90F0';
            name: 'cube';
        };
        implements: [];
        interfaceMap: {};
        inverseInterfaceMap: {};
        links: {
            bomLines: $ObjectMetadata.Link<BomLine, true>;
            inventoryLots: $ObjectMetadata.Link<InventoryLot, true>;
            shortages: $ObjectMetadata.Link<Shortage, true>;
            supplier: $ObjectMetadata.Link<Supplier, false>;
        };
        pluralDisplayName: 'Parts';
        primaryKeyApiName: 'partNumber';
        primaryKeyType: 'string';
        properties: {
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'Criticality'
             */
            criticality: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'Description'
             */
            description: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'Lead Time Days'
             */
            leadTimeDays: $PropertyDef<'integer', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'Part Number'
             */
            partNumber: $PropertyDef<'string', 'non-nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'Supplier Id'
             */
            supplierId: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'Unit Cost Usd'
             */
            unitCostUsd: $PropertyDef<'double', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'Uom'
             */
            uom: $PropertyDef<'string', 'nullable', 'single'>;
        };
        rid: 'ri.ontology.main.object-type.29529a89-f8f4-4a24-a451-12e726d771dc';
        status: 'EXPERIMENTAL';
        titleProperty: 'description';
        type: 'object';
        visibility: 'NORMAL';
    };
}
export declare const Part: Part;
