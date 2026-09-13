import type { PropertyDef as $PropertyDef } from '@osdk/client';
import { $osdkMetadata } from '../../OntologyMetadata.js';
import type { Part } from './Part.js';
import type { ObjectTypeDefinition as $ObjectTypeDefinition, ObjectMetadata as $ObjectMetadata } from '@osdk/client';
import type { ObjectSet as $ObjectSet, Osdk as $Osdk, PropertyValueWireToClient as $PropType, SingleLinkAccessor as $SingleLinkAccessor } from '@osdk/client';
export declare namespace InventoryLot {
    type PropertyKeys = 'location' | 'lotId' | 'partNumber' | 'qtyOnHand' | 'receivedDate';
    interface Links {
        readonly part: $SingleLinkAccessor<Part>;
    }
    interface Props {
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'Location'
         */
        readonly location: $PropType['string'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'Lot Id'
         */
        readonly lotId: $PropType['string'];
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'Part Number'
         */
        readonly partNumber: $PropType['string'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'Qty On Hand'
         */
        readonly qtyOnHand: $PropType['integer'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'Received Date'
         */
        readonly receivedDate: $PropType['datetime'] | undefined;
    }
    type StrictProps = Props;
    interface ObjectSet extends $ObjectSet<InventoryLot, InventoryLot.ObjectSet> {
    }
    type OsdkInstance<OPTIONS extends never | '$rid' = never, K extends keyof InventoryLot.Props = keyof InventoryLot.Props> = $Osdk.Instance<InventoryLot, OPTIONS, K>;
    /** @deprecated use OsdkInstance */
    type OsdkObject<OPTIONS extends never | '$rid' = never, K extends keyof InventoryLot.Props = keyof InventoryLot.Props> = OsdkInstance<OPTIONS, K>;
}
export interface InventoryLot extends $ObjectTypeDefinition {
    osdkMetadata: typeof $osdkMetadata;
    type: 'object';
    apiName: 'InventoryLot';
    primaryKeyApiName: 'lotId';
    primaryKeyType: 'string';
    __DefinitionMetadata?: {
        objectSet: InventoryLot.ObjectSet;
        props: InventoryLot.Props;
        linksType: InventoryLot.Links;
        strictProps: InventoryLot.StrictProps;
        apiName: 'InventoryLot';
        description: 'Stock on hand for a part, by location.';
        displayName: 'Inventory Lot';
        icon: {
            type: 'blueprint';
            color: '#4C90F0';
            name: 'cube';
        };
        implements: [];
        interfaceMap: {};
        inverseInterfaceMap: {};
        links: {
            part: $ObjectMetadata.Link<Part, false>;
        };
        pluralDisplayName: 'Inventory Lots';
        primaryKeyApiName: 'lotId';
        primaryKeyType: 'string';
        properties: {
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'Location'
             */
            location: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'Lot Id'
             */
            lotId: $PropertyDef<'string', 'non-nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'Part Number'
             */
            partNumber: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'Qty On Hand'
             */
            qtyOnHand: $PropertyDef<'integer', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'Received Date'
             */
            receivedDate: $PropertyDef<'datetime', 'nullable', 'single'>;
        };
        rid: 'ri.ontology.main.object-type.aa767302-3764-46f4-b5a3-b587371af949';
        status: 'EXPERIMENTAL';
        titleProperty: 'lotId';
        type: 'object';
        visibility: 'NORMAL';
    };
}
export declare const InventoryLot: InventoryLot;
