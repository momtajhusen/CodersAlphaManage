declare module '@expo/vector-icons' {
    import { IconProps } from 'react-native-vector-icons/Icon';
    import { Component } from 'react';

    export class Feather extends Component<IconProps> {}
    export class Ionicons extends Component<IconProps> {}
    export class MaterialIcons extends Component<IconProps> {}
    export class FontAwesome extends Component<IconProps> {}
    // Add other icon sets as needed
}

declare module 'lodash';
