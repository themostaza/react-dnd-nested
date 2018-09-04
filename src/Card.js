/* @flow */
import React from "react";
import { findDOMNode } from "react-dom";
import { DragSource, DropTarget } from "react-dnd";
import { CardContext } from "./CardContext";

// px
const PARENT_OFFSET: number = 30;

type ContextProps = {
  beginDrag: (id: number) => any,
  endDrag: (id: number) => any,
  moveCard: (id: number, params: Object) => any
};

type OwnProps = {
  id: number,
  level: number,
  initialLevel?: number
};

type DNDProps = {
  // TODO: typedef
  isDragging: boolean,
  connectDragSource: any,
  connectDropTarget: any,
  connectDragPreview: any
};

type Props = ContextProps & OwnProps & DNDProps;

const Types = {
  CARD: "card"
};

const cardSource = {
  beginDrag(props: Props) {
    const item = { id: props.id };
    props.beginDrag(props.id);
    return item;
  },

  endDrag(props, monitor, component) {
    const item = monitor.getItem();
    // TODO: handle drop result
    const dropResult = monitor.getDropResult();

    props.endDrag(props.id);
  }
};

const cardTarget = {
  canDrop() {
    return false;
  },

  hover(props, monitor, component) {
    const { id: draggedId } = monitor.getItem();
    const { id: overId, initialLevel, level } = props;

    let newLevel;
    const adjustedX =
      initialLevel * PARENT_OFFSET + monitor.getDifferenceFromInitialOffset().x;

    newLevel = Math.floor(adjustedX / PARENT_OFFSET);
    newLevel = newLevel < 0 ? 0 : newLevel;

    if (draggedId !== overId || level !== newLevel) {
      if (!monitor.isOver({ shallow: true })) return;

      const params = {};
      if (draggedId !== overId) {
        // $FlowFixMe
        const hoverBoundingRect = findDOMNode(
          component
        ).getBoundingClientRect();
        const hoverMiddleY =
          (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
        const clientOffset = monitor.getClientOffset();
        const hoverClientY = clientOffset.y - hoverBoundingRect.top;
        if (hoverClientY < hoverMiddleY) {
          params.beforeId = overId;
        } else {
          params.afterId = overId;
        }
      }
      if (initialLevel != null) params.newLevel = newLevel;
      props.moveCard(draggedId, params);
    }
  }
};

function dragCollect(connect, monitor) {
  return {
    connectDragSource: connect.dragSource(),
    isDragging: monitor.isDragging(),
    connectDragPreview: connect.dragPreview()
  };
}

function dropCollect(connect, monitor) {
  return {
    connectDropTarget: connect.dropTarget(),
    isOver: monitor.isOver()
  };
}

const handleStyle = {
  backgroundColor: "black",
  width: "0.5rem",
  height: "1rem",
  display: "inline-block",
  marginRight: "0.75rem",
  cursor: "move"
};

class Card extends React.Component<Props> {
  render() {
    // Component props
    const { id, level } = this.props;
    // DND props
    const {
      isDragging,
      connectDragSource,
      connectDropTarget,
      connectDragPreview
    } = this.props;

    const style = cardStyle;
    return connectDropTarget(
      <div style={{ width: "100%", textAlign: "center" }}>
        <div style={{ ...style, paddingLeft: level * PARENT_OFFSET }}>
          {connectDragPreview(
            <div style={isDragging ? { backgroundColor: "black" } : {}}>
              {connectDragSource(<div style={handleStyle} />)}
              {`That's the card number ${id}`}
            </div>
          )}
        </div>
      </div>
    );
  }
}

const cardStyle = {
  display: "inline-block",
  marginLeft: 0,
  textAlign: "left"
};

export const CardWithDND = DropTarget("card", cardTarget, dropCollect)(
  DragSource(Types.CARD, cardSource, dragCollect)(Card)
);

export default (props: OwnProps) => (
  <CardContext.Consumer>
    {/* $FlowFixMe */}
    {({ beginDrag, endDrag, moveCard }) => (
      <CardWithDND
        {...props}
        beginDrag={beginDrag}
        moveCard={moveCard}
        endDrag={endDrag}
      />
    )}
  </CardContext.Consumer>
);
