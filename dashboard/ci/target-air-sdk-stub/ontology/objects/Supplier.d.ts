import type { PropertyDef as $PropertyDef } from '@osdk/client';
import { $osdkMetadata } from '../../OntologyMetadata.js';
import type { Part } from './Part.js';
import type { ObjectTypeDefinition as $ObjectTypeDefinition, ObjectMetadata as $ObjectMetadata } from '@osdk/client';
import type { ObjectSet as $ObjectSet, Osdk as $Osdk, PropertyValueWireToClient as $PropType } from '@osdk/client';
export declare namespace Supplier {
    type PropertyKeys = 'avgLeadTimeDays' | 'location' | 'onTimeRate' | 'supplierId' | 'supplierName';
    interface Links {
        readonly parts: Part.ObjectSet;
    }
    interface Props {
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'Avg Lead Time Days'
         */
        readonly avgLeadTimeDays: $PropType['integer'] | undefined;
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
         *   display name: 'On Time Rate'
         */
        readonly onTimeRate: $PropType['double'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'Supplier Id'
         */
        readonly supplierId: $PropType['string'];
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'Supplier Name'
         */
        readonly supplierName: $PropType['string'] | undefined;
    }
    type StrictProps = Props;
    interface ObjectSet extends $ObjectSet<Supplier, Supplier.ObjectSet> {
    }
    type OsdkInstance<OPTIONS extends never | '$rid' = never, K extends keyof Supplier.Props = keyof Supplier.Props> = $Osdk.Instance<Supplier, OPTIONS, K>;
    /** @deprecated use OsdkInstance */
    type OsdkObject<OPTIONS extends never | '$rid' = never, K extends keyof Supplier.Props = keyof Supplier.Props> = OsdkInstance<OPTIONS, K>;
}
export interface Supplier extends $ObjectTypeDefinition {
    osdkMetadata: typeof $osdkMetadata;
    type: 'object';
    apiName: 'Supplier';
    primaryKeyApiName: 'supplierId';
    primaryKeyType: 'string';
    __DefinitionMetadata?: {
        objectSet: Supplier.ObjectSet;
        props: Supplier.Props;
        linksType: Supplier.Links;
        strictProps: Supplier.StrictProps;
        apiName: 'Supplier';
        description: 'A parts supplier. On-time rate and lead time drive shortage risk.';
        displayName: 'Supplier';
        icon: {
            type: 'blueprint';
            color: '#4C90F0';
            name: 'cube';
        };
        implements: [];
        interfaceMap: {};
        inverseInterfaceMap: {};
        links: {
            parts: $ObjectMetadata.Link<Part, true>;
        };
        pluralDisplayName: 'Suppliers';
        primaryKeyApiName: 'supplierId';
        primaryKeyType: 'string';
        properties: {
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'Avg Lead Time Days'
             */
            avgLeadTimeDays: $PropertyDef<'integer', 'nullable', 'single'>;
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
             *   display name: 'On Time Rate'
             */
            onTimeRate: $PropertyDef<'double', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'Supplier Id'
             */
            supplierId: $PropertyDef<'string', 'non-nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'Supplier Name'
             */
            supplierName: $PropertyDef<'string', 'nullable', 'single'>;
        };
        rid: 'ri.ontology.main.object-type.83bf27ff-38c0-4e2b-a2e4-3affb3f8f37f';
        status: 'EXPERIMENTAL';
        titleProperty: 'supplierName';
        type: 'object';
        visibility: 'NORMAL';
    };
}
export declare const Supplier: Supplier;
