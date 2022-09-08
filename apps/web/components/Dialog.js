import React from "react";
import {
  FocusScope,
  OverlayContainer,
  OverlayProvider,
  useDialog,
  useModal,
  useOverlay,
  usePreventScroll,
} from "react-aria";

const Dialog = ({ style, ...props }) => {
  const { children } = props;

  // Handle interacting outside the dialog and pressing
  // the Escape key to close the modal.
  const ref = React.useRef();
  const { overlayProps, underlayProps } = useOverlay(props, ref);

  // Prevent scrolling while the modal is open, and hide content
  // outside the modal from screen readers.
  usePreventScroll();
  const { modalProps } = useModal();

  // Get props for the dialog and its title
  const { dialogProps, titleProps } = useDialog(props, ref);

  return (
    <div
      style={{
        position: "fixed",
        zIndex: 100,
        top: 0,
        left: 0,
        bottom: 0,
        right: 0,
        background: "rgb(0 0 0 / 15%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem 2rem 12vh",
        overflow: "auto",
      }}
      {...underlayProps}
    >
      <FocusScope contain restoreFocus autoFocus>
        <div
          {...overlayProps}
          {...dialogProps}
          {...modalProps}
          ref={ref}
          style={{
            background: "white",
            // boxShadow: "0 0.6rem 2.4rem 0 rgb(0 0 0 / 5%)",
            // borderRadius: "1rem",
            padding: "1rem",
            width: "100%",
            maxWidth: "62rem",
            maxHeight: "min(calc(100% - 3rem), 82rem)",
            borderRadius: "0.4rem",
            boxShadow:
              "rgb(15 15 15 / 10%) 0px 0px 0px 1px, rgb(15 15 15 / 20%) 0px 5px 10px, rgb(15 15 15 / 40%) 0px 15px 40px",

            ...style,
          }}
        >
          {children({ titleProps })}
        </div>
      </FocusScope>
    </div>
  );
};

export default function DialogWrapper({
  isOpen,
  onRequestClose,
  children,
  ...props
}) {
  if (!isOpen) return null;
  return (
    <OverlayProvider>
      <OverlayContainer>
        <Dialog isOpen onClose={onRequestClose} isDismissable {...props}>
          {children}
        </Dialog>
      </OverlayContainer>
    </OverlayProvider>
  );
}
